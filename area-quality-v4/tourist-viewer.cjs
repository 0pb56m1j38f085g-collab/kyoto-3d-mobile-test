'use strict';
// Cartographic detail is the same on phones and desktops; all geometry/light
// indices remain uploaded, so zoom never changes the shared lighting layout.
module.exports=({renderer,app,html})=>{
 const replace=(a,b)=>{if(renderer.split(a).length!==2)throw Error('Street viewer anchor: '+a);renderer=renderer.replace(a,b);};
 replace('render(camera,time=0){this.resize();','render(camera,time=0){this.resize();this.streetDetailsVisible=camera.span*this.w/this.h<=24;');
 replace('for(const b of this.batches){if(!shadows&&',"for(const b of this.batches){if(b.name.startsWith('storybook-detail-')&&!this.streetDetailsVisible)continue;if(!shadows&&");
 return {renderer,app,html};
};
