/* A pinched, flowing water ridge and a separate foreground wet roll around the tip. */
(() => {
  window.createOceanGripWater=function(rear,front){
    const fragment=`precision highp float;
      uniform vec2 size;uniform float gx,gy,yl,yr,phase,time,armSize,frontLayer;uniform sampler2D photo;
      float bez(float t,float a,float b,float c,float d){float q=1.-t;return q*q*q*a+3.*q*q*t*b+3.*q*t*t*c+t*t*t*d;}
      float noise(vec2 p){return sin(p.x*28.+p.y*19.-time*2.8)*.47+sin(p.x*59.-p.y*31.+time*3.4)*.28+sin(p.x*103.+p.y*67.-time*5.)*.14;}
      vec3 waterColor(vec2 p,float depth){vec3 c=texture2D(photo,clamp(p,vec2(.002),vec2(.998))).rgb;return mix(c,c*vec3(.46,.79,.88),depth);}
      void main(){
        vec2 uv=vec2(gl_FragCoord.x/size.x,1.-gl_FragCoord.y/size.y);
        float squeeze=smoothstep(.15,.47,phase),release=1.-smoothstep(.88,1.,phase);
        if(frontLayer>.5){
          vec2 local=(uv-vec2(gx,gy))*size/armSize;
          float fall=local.y+.018;
          if(fall<0.||fall>.13)discard;
          float taper=1.-smoothstep(.025,.13,fall);
          float bend=sin(fall*34.-time*2.2)*.004;
          float width=.022*taper;
          float edge=abs(local.x-bend)/max(.001,width);
          if(edge>1.08)discard;
          vec2 sampleUV=vec2(gx+local.x*1.4,fract(fall*6.-time*.19));
          vec3 c=waterColor(sampleUV,.22);
          float highlight=pow(max(0.,1.-abs(edge-.74)*3.),4.);
          c+=vec3(.28,.44,.41)*highlight;
          float alpha=(1.-smoothstep(.55,1.08,edge))*squeeze*release*taper*.8;
          gl_FragColor=vec4(c,alpha);return;
        }
        bool left=uv.x<gx;float a=0.,b=1.;
        for(int i=0;i<11;i++){float q=(a+b)*.5;float px=left?bez(q,0.,.38,gx-.17,gx):bez(q,gx,gx+.13,.90,1.);if(px<uv.x)a=q;else b=q;}
        float q=(a+b)*.5,edge=left?bez(q,yl,yl,gy,gy):bez(q,gy,gy,yr,yr);
        float near=exp(-pow((uv.x-gx)/.17,2.));
        edge+=sin(uv.x*42.-time*3.)*.0035*squeeze*(1.-near*.6);
        float height=min(.038+near*.09,.19*size.x/size.y);
        float v=(uv.y-edge)/height;
        if(v<0.)discard;
        if(v>1.){
          float alpha=0.;
          for(int i=0;i<13;i++){
            float fi=float(i),sx=.035+fi*.078;
            sx+=(gx-sx)*near*.06+sin(time*1.7+fi)*.002;
            float fall=uv.y-edge-height,tail=.025+.07*fract(fi*.618);
            float width=(.0012+.0011*fract(fi*.731))*max(.12,1.-fall/tail);
            float flow=exp(-pow((uv.x-sx)/width,2.))*(1.-smoothstep(0.,tail,fall));
            float pulse=.55+.45*sin(time*4.-fall*80.+fi*3.);
            alpha=max(alpha,flow*pulse);
          }
          if(alpha<.02)discard;
          gl_FragColor=vec4(vec3(.32,.66,.71),alpha*squeeze*release*.65);return;
        }
        float roll=sin(v*1.57),n=noise(vec2(uv.x,v*.2));
        float flow=v+time*.26*(.3+near);
        float wx=uv.x+(gx-uv.x)*pow(v,2.)*near*squeeze*.55;
        wx+=n*.002+sin(flow*5.+uv.x*12.)*.002*roll;
        float wy=clamp(.92-.85*v+sin(flow*5.+uv.x*11.)*.018,.01,.99);
        vec3 c=waterColor(vec2(wx,wy),.15+.5*roll);
        float ridge=.5+.5*sin(v*3.14);
        c*=.78+.34*ridge;
        float gloss=pow(max(0.,n*.8+.35),4.);
        c+=vec3(.055,.12,.13)*gloss*roll;
        float foam=pow(max(0.,sin(uv.x*147.+time*4.+n*2.)*sin(uv.x*83.-time*2.8)),5.);
        c+=vec3(.64,.79,.72)*foam*smoothstep(.82,1.,v);
        float alpha=smoothstep(0.,.25,v)*smoothstep(.12,.30,phase)*release;
        gl_FragColor=vec4(c,alpha);
      }`;
    const targets=[rear,front].map((canvas,index)=>{
      const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)return null;
      const shader=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null;};
      const vs=shader(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'),fs=shader(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return null;
      const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
      gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      const u=Object.fromEntries(['size','gx','gy','yl','yr','phase','time','armSize','frontLayer','photo'].map(k=>[k,gl.getUniformLocation(program,k)]));
      return {canvas,gl,program,u,index,ready:false};
    });
    const video=document.querySelector('.ocean-flow-source');
    const image=new Image();image.onload=()=>targets.forEach(target=>{
      if(!target)return;const {gl,u}=target,texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);gl.uniform1i(u.photo,0);target.ready=true;target.canvas.dataset.ready='true';
    });image.src='assets/ocean/sunset-sea-v2.webp';
    return {paint(state){
      const {w,h,gx,gy,yl,yr,phase,time,size}=state;
      targets.forEach(target=>{
        if(!target?.ready)return;const {gl,u,canvas,index}=target,ratio=innerWidth<700?1:1.1;
        const width=Math.round(w*ratio),height=Math.round(h*ratio);
        if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
        if(video?.readyState>=2){gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,video);}
        gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform2f(u.size,width,height);gl.uniform1f(u.gx,gx/w);gl.uniform1f(u.gy,gy/h);gl.uniform1f(u.yl,yl/h);gl.uniform1f(u.yr,yr/h);gl.uniform1f(u.phase,phase);gl.uniform1f(u.time,time);gl.uniform1f(u.armSize,size*ratio);gl.uniform1f(u.frontLayer,index);gl.drawArrays(gl.TRIANGLES,0,6);
        canvas.dataset.time=time.toFixed(2);
      });
    }};
  };
})();
