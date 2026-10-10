import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Scene } from '@babylonjs/core/scene';
import { harborHeight } from './harbor-layout';
import type { StreetPoint } from './navigation';

export function createRouteGuide(scene:Scene){
  const material=new StandardMaterial('wayfinding-blue',scene);material.diffuseColor=Color3.FromHexString('#5eaccb');material.emissiveColor=Color3.FromHexString('#315e70');material.disableLighting=true;material.backFaceCulling=false;
  let mesh:Mesh|null=null;
  return{
    setRoute(route:StreetPoint[]){
      mesh?.dispose();mesh=null;if(route.length<2)return;
      const left:Vector3[]=[],right:Vector3[]=[];
      for(let i=1;i<route.length;i++){
        const a=route[i-1],b=route[i],distance=Math.hypot(b.x-a.x,b.z-a.z);if(distance<.01)continue;
        const nx=-(b.z-a.z)/distance*.22,nz=(b.x-a.x)/distance*.22,steps=Math.ceil(distance);
        for(let j=0;j<=steps;j++){
          const t=j/steps,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
          const y=.055+(x>=95?harborHeight({x,z}):z<534&&Math.abs(x)>14.3?.22:0);
          left.push(new Vector3(x+nx,y,z+nz));right.push(new Vector3(x-nx,y,z-nz));
        }
      }
      if(left.length<2)return;
      mesh=MeshBuilder.CreateRibbon('destination-road-line',{pathArray:[left,right],sideOrientation:Mesh.DOUBLESIDE},scene);mesh.material=material;mesh.isPickable=false;
    },
    setVisible(visible:boolean){mesh?.setEnabled(visible);},
    reset(){mesh?.dispose();mesh=null;},
  };
}
