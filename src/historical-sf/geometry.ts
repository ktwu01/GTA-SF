import { Material } from '@babylonjs/core/Materials/material';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';

type Point = [number, number, number];
type Group = { positions: number[]; normals: number[]; uvs: number[]; indices: number[] };

/** Static details share buffers by material; one window never becomes one draw call. */
export class Masonry {
  private groups = new Map<Material, Group>();
  private cos: number;
  private sin: number;
  constructor(private scene: Scene, private name: string, private origin: Point = [0, 0, 0], private yaw = 0) {
    this.cos = Math.cos(yaw); this.sin = Math.sin(yaw);
  }
  private point(p: Point): Point { return [p[0] * this.cos + p[2] * this.sin + this.origin[0], p[1] + this.origin[1], -p[0] * this.sin + p[2] * this.cos + this.origin[2]]; }
  face(mat: Material, points: Point[], uvScale = 1) {
    let group = this.groups.get(mat);
    if (!group) { group = { positions: [], normals: [], uvs: [], indices: [] }; this.groups.set(mat, group); }
    const p = points.map(p => this.point(p));
    const v0 = Vector3.FromArray(p[0]);
    const normal = Vector3.Cross(Vector3.FromArray(p[1]).subtract(v0), Vector3.FromArray(p[2]).subtract(v0)).normalize();
    const base = group.positions.length / 3;
    p.forEach((v, i) => { group!.positions.push(...v); group!.normals.push(normal.x, normal.y, normal.z); group!.uvs.push((i > 1 ? uvScale : 0), i === 1 || i === 2 ? uvScale : 0); });
    for (let i = 1; i < p.length - 1; i++) group.indices.push(base, base + i + 1, base + i);
  }
  box(mat: Material, x: number, y: number, z: number, w: number, h: number, d: number) {
    const l=x-w/2,r=x+w/2,b=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;
    this.face(mat, [[l,b,n],[l,t,n],[r,t,n],[r,b,n]]);
    this.face(mat, [[r,b,f],[r,t,f],[l,t,f],[l,b,f]]);
    this.face(mat, [[l,b,f],[l,t,f],[l,t,n],[l,b,n]]);
    this.face(mat, [[r,b,n],[r,t,n],[r,t,f],[r,b,f]]);
    this.face(mat, [[l,t,n],[l,t,f],[r,t,f],[r,t,n]]);
    this.face(mat, [[l,b,f],[l,b,n],[r,b,n],[r,b,f]]);
  }
  cylinder(mat: Material, x: number, y: number, z: number, radius: number, height: number, top = radius, segments = 12) {
    for (let i=0;i<segments;i++) {
      const a=i/segments*Math.PI*2, b=(i+1)/segments*Math.PI*2;
      const p:Point=[x+Math.cos(a)*radius,y-height/2,z+Math.sin(a)*radius];
      const q:Point=[x+Math.cos(b)*radius,y-height/2,z+Math.sin(b)*radius];
      const r:Point=[x+Math.cos(b)*top,y+height/2,z+Math.sin(b)*top];
      const s:Point=[x+Math.cos(a)*top,y+height/2,z+Math.sin(a)*top];
      this.face(mat,[q,p,s,r]); this.face(mat,[[x,y+height/2,z],r,s]); this.face(mat,[[x,y-height/2,z],p,q]);
    }
  }
  ellipsoid(mat: Material, x:number,y:number,z:number, rx:number,ry:number,rz:number, hemisphere=false, segments=16) {
    const rings=hemisphere?6:10;
    const lat=(r:number)=>hemisphere?r/rings*Math.PI/2:-Math.PI/2+r/rings*Math.PI;
    const p=(a:number,b:number):Point=>[x+Math.cos(a)*Math.cos(b)*rx,y+Math.sin(b)*ry,z+Math.sin(a)*Math.cos(b)*rz];
    for(let j=0;j<rings;j++) for(let i=0;i<segments;i++) {
      const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2;
      const points=[p(b,lat(j)),p(a,lat(j)),p(a,lat(j+1)),p(b,lat(j+1))];this.face(mat,points);
      const group=this.groups.get(mat)!;const offset=group.normals.length-12;
      points.forEach((v,index)=>{const n=new Vector3((v[0]-x)/(rx*rx),(v[1]-y)/(ry*ry),(v[2]-z)/(rz*rz)).normalize();group.normals[offset+index*3]=n.x*this.cos+n.z*this.sin;group.normals[offset+index*3+1]=n.y;group.normals[offset+index*3+2]=-n.x*this.sin+n.z*this.cos;});
    }
  }
  beam(mat:Material, a:Point,b:Point,radius:number,segments=6) {
    const axis=Vector3.FromArray(b).subtract(Vector3.FromArray(a)).normalize();
    const normal=Vector3.Cross(axis, Math.abs(axis.y)>.9?Vector3.Right():Vector3.Up()).normalize();
    const binormal=Vector3.Cross(axis,normal).normalize();
    const point=(p:Point,t:number):Point=>[p[0]+radius*(normal.x*Math.cos(t)+binormal.x*Math.sin(t)),p[1]+radius*(normal.y*Math.cos(t)+binormal.y*Math.sin(t)),p[2]+radius*(normal.z*Math.cos(t)+binormal.z*Math.sin(t))];
    for(let i=0;i<segments;i++) { const s=i/segments*Math.PI*2,t=(i+1)/segments*Math.PI*2;this.face(mat,[point(a,s),point(a,t),point(b,t),point(b,s)]); }
  }
  arch(mat:Material|null,x:number,bottom:number,z:number,width:number,height:number,frame:Material,thickness=.15) {
    const radius=width/2, spring=bottom+height-radius;
    if(mat)this.face(mat,[[x-radius,bottom,z],[x-radius,spring,z],[x+radius,spring,z],[x+radius,bottom,z]]);
    for(let i=0;i<12;i++) {
      const a=i/12*Math.PI,b=(i+1)/12*Math.PI;
      if(mat)this.face(mat,[[x,spring,z],[x+Math.cos(b)*radius,spring+Math.sin(b)*radius,z],[x+Math.cos(a)*radius,spring+Math.sin(a)*radius,z]]);
      const p:Point=[x+Math.cos(a)*(radius+thickness/2),spring+Math.sin(a)*(radius+thickness/2),z-.05];
      const q:Point=[x+Math.cos(b)*(radius+thickness/2),spring+Math.sin(b)*(radius+thickness/2),z-.05];
      this.beam(frame,p,q,thickness*.7,4);
    }
    this.box(frame,x-radius-thickness/2,(bottom+spring)/2,z-.05,thickness,spring-bottom,.2);
    this.box(frame,x+radius+thickness/2,(bottom+spring)/2,z-.05,thickness,spring-bottom,.2);
  }
  prism(mat:Material,points:[number,number][],bottom:number,height:number){
    for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];this.face(mat,[[a[0],bottom,a[1]],[a[0],bottom+height,a[1]],[b[0],bottom+height,b[1]],[b[0],bottom,b[1]]]);}
    this.face(mat,points.map(v=>[v[0],bottom+height,v[1]] as Point).reverse());
  }
  finish(parent?:TransformNode, shadows=true):Mesh[] {
    const meshes:Mesh[]=[];
    for(const [material,g] of this.groups) {
      const mesh=new Mesh(`${this.name}-${material.name}`,this.scene);
      const data=new VertexData(); data.positions=g.positions;data.normals=g.normals;data.uvs=g.uvs;data.indices=g.indices;data.applyToMesh(mesh);
      mesh.material=material;mesh.parent=parent??null;mesh.receiveShadows=shadows;mesh.isPickable=false;
      if(!parent)mesh.freezeWorldMatrix();
      meshes.push(mesh);
    }
    this.groups.clear();return meshes;
  }
}
