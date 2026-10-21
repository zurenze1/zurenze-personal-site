/* Skinned texture mesh: the elbow, lower arm and tip articulate independently. */
(() => {
  const source=[ [.97,.08],[.87,.29],[.72,.39],[.56,.33],[.42,.24],[.30,.19],[.21,.22],[.15,.32],[.12,.46],[.12,.61],[.15,.76],[.22,.85],[.29,.85],[.34,.78],[.32,.70],[.285,.675] ];
  const open=[ [.97,.08],[.87,.29],[.72,.39],[.56,.33],[.42,.24],[.30,.19],[.21,.22],[.15,.32],[.12,.46],[.115,.62],[.12,.76],[.13,.86],[.17,.93],[.22,.95],[.26,.93],[.28,.88] ];
  const closed=[ [.97,.08],[.87,.29],[.72,.39],[.56,.33],[.42,.24],[.30,.19],[.21,.22],[.15,.32],[.12,.46],[.12,.605],[.13,.697],[.16,.742],[.195,.73],[.207,.70],[.195,.677],[.178,.669] ];
  const clamp=v=>Math.min(1,Math.max(0,v));
  const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a));return x*x*(3-2*x);};
  window.createOceanTentacle=function(canvas,fallback){
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});
    if(!gl)return null;
    const vert='attribute vec2 p,uv;varying vec2 tex;void main(){tex=uv;gl_Position=vec4(p,0.,1.);}';
    const frag='precision mediump float;varying vec2 tex;uniform sampler2D photo;uniform float opacity;void main(){vec4 c=texture2D(photo,tex);gl_FragColor=vec4(c.rgb,c.a*opacity);}';
    function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null;}
    const vs=shader(gl.VERTEX_SHADER,vert),fs=shader(gl.FRAGMENT_SHADER,frag);if(!vs||!fs)return null;
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
    gl.useProgram(program);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    const cols=64,rows=48,vertices=[],indices=[],weights=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const x=i/cols,y=j/rows;vertices.push(x,y,x,y);
      const candidates=[];
      for(let k=0;k<source.length-1;k++){
        const a=source[k],b=source[k+1],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
        const t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(length*length));
        const px=a[0]+dx*t,py=a[1]+dy*t,ox=x-px,oy=y-py;
        candidates.push({k,t,along:(ox*dx+oy*dy)/length,perp:(-ox*dy+oy*dx)/length,d:Math.hypot(ox,oy)});
      }
      candidates.sort((a,b)=>a.d-b.d);const nearest=candidates.slice(0,3),sum=nearest.reduce((s,e)=>s+1/Math.pow(e.d+.012,3),0);
      weights.push(nearest.map(e=>({...e,weight:1/Math.pow(e.d+.012,3)/sum})));
    }
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;indices.push(a,b,c,b,d,c);}
    const data=new Float32Array(vertices),buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
    const p=gl.getAttribLocation(program,'p'),uv=gl.getAttribLocation(program,'uv');gl.enableVertexAttribArray(p);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(p,2,gl.FLOAT,false,16,0);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,16,8);
    const element=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,element);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    const opacity=gl.getUniformLocation(program,'opacity'),photo=gl.getUniformLocation(program,'photo');let ready=false,lastState=null;
    const image=new Image();image.onload=()=>{
      const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.uniform1i(photo,0);ready=true;canvas.dataset.ready='true';fallback.style.visibility='hidden';if(lastState)paint(lastState);
    };image.src='assets/ocean/tentacle-v2.webp';
    function paint(state){
      lastState=state;if(!ready)return;
      const {w,h,gx,gy,size,phase,time}=state,ratio=Math.min(devicePixelRatio||1,1.2);
      if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);gl.viewport(0,0,canvas.width,canvas.height);}
      const curl=smooth(.16,.46,phase),reach=smooth(.01,.16,phase),lift=smooth(.46,.85,phase);
      const target=source.map((point,k)=>{
        const distal=smooth(5,15,k),elbow=Math.sin((k/15)*Math.PI)*.026;
        let x=open[k][0]+(closed[k][0]-open[k][0])*curl;
        let y=open[k][1]+(closed[k][1]-open[k][1])*curl;
        x+=Math.sin(phase*5+k*.31)*elbow*lift;
        y+=Math.sin(phase*7-k*.35)*.012*distal*lift;
        return [x,y];
      });
      const tip=target[15],anchor=[tip[0]+.009,tip[1]+.026];
      const angle=(-.085+curl*.11-lift*.11),cos=Math.cos(angle),sin=Math.sin(angle),height=size/1.5;
      const enter=(1-reach)*h*.7;
      for(let n=0;n<weights.length;n++){
        let x=0,y=0;
        for(const e of weights[n]){
          const a=target[e.k],b=target[e.k+1],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
          const sx=a[0]+dx*e.t+(dx*e.along-dy*e.perp)/len;
          const sy=a[1]+dy*e.t+(dy*e.along+dx*e.perp)/len;
          x+=sx*e.weight;y+=sy*e.weight;
        }
        const px=(x-anchor[0])*size,py=(y-anchor[1])*height;
        const wx=gx+px*cos-py*sin,wy=gy+px*sin+py*cos-enter;
        data[n*4]=wx/w*2-1;data[n*4+1]=1-wy/h*2;
      }
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,data);gl.uniform1f(opacity,smooth(.01,.10,phase));gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
      canvas.dataset.curl=curl.toFixed(3);canvas.dataset.tip=`${Math.round(gx)},${Math.round(gy)}`;canvas.dataset.pose=phase.toFixed(3);
    }
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;canvas.hidden=true;fallback.style.visibility='visible';});
    return {paint};
  };
})();
