  // --- Carousel Global Variables ---
        var radius = 240;
        var autoRotate = true;
        var rotateSpeed = -60;
        var imgWidth = 120;
        var imgHeight = 170;
        var odrag, ospin, aImg, aVid, aEle, ground;
        var sX, sY, nX, nY, desX = 0, desY = 0, tX = 0, tY = 10;
        function init(delayTime) {
            aEle = [...ospin.getElementsByTagName('img'), ...ospin.getElementsByTagName('video')];
            for (var i = 0; i < aEle.length; i++) {
                aEle[i].style.transform = "rotateY(" + (i * (360 / aEle.length)) + "deg) translateZ(" + radius + "px)";
                aEle[i].style.transition = "transform 1s";
                aEle[i].style.transitionDelay = delayTime || (aEle.length - i) / 4 + "s";
            }
        }
        function applyTranform(obj) {
            if (tY > 180) tY = 180;
            if (tY < 0) tY = 0;
            obj.style.transform = "rotateX(" + (-tY) + "deg) rotateY(" + (tX) + "deg)";
        }
        function playSpin(yes) {
            ospin.style.animationPlayState = (yes ? 'running' : 'paused');
        }
        window.addEventListener('DOMContentLoaded', function () {
            odrag = document.getElementById('drag-container');
            ospin = document.getElementById('spin-container');
            ground = document.getElementById('ground');
            aImg = ospin.getElementsByTagName('img');
            aVid = ospin.getElementsByTagName('video');
            aEle = [...aImg, ...aVid];
            ospin.style.width = imgWidth + "px";
            ospin.style.height = imgHeight + "px";
            ground.style.width = radius * 3 + "px";
            ground.style.height = radius * 3 + "px";
            setTimeout(init, 1000);
            if (autoRotate) {
                var animationName = (rotateSpeed > 0 ? 'spin' : 'spinRevert');
                ospin.style.animation = `${animationName} ${Math.abs(rotateSpeed)}s infinite linear`;
            }
            document.onpointerdown = function (e) {
                clearInterval(odrag.timer);
                e = e || window.event;
                var sX = e.clientX, sY = e.clientY;
                this.onpointermove = function (e) {
                    e = e || window.event;
                    var nX = e.clientX, nY = e.clientY;
                    desX = nX - sX;
                    desY = nY - sY;
                    tX += desX * 0.1;
                    tY += desY * 0.1;
                    applyTranform(odrag);
                    sX = nX;
                    sY = nY;
                };
                this.onpointerup = function (e) {
                    odrag.timer = setInterval(function () {
                        desX *= 0.95;
                        desY *= 0.95;
                        tX += desX * 0.1;
                        tY += desY * 0.1;
                        applyTranform(odrag);
                        playSpin(false);
                        if (Math.abs(desX) < 0.5 && Math.abs(desY) < 0.5) {
                            clearInterval(odrag.timer);
                            playSpin(true);
                        }
                    }, 17);
                    this.onpointermove = this.onpointerup = null;
                }
                return false;
            }
            document.onmousewheel = function (e) {
                e = e || window.event;
                var d = e.wheelDelta / 20 || -e.detail;
                radius += d;
                init(1);
            };

            // --- Modern Play/Pause Button ---
            var music = document.getElementById('bg-music');
            var playPauseBtn = document.getElementById('playPauseBtn');
            var iconPlay = document.getElementById('icon-play');
            var iconPause = document.getElementById('icon-pause');
            function updateMusicBtn() {
                if (music.paused) {
                    iconPlay.classList.remove('icon-hide');
                    iconPause.classList.add('icon-hide');
                    playPauseBtn.setAttribute('aria-label', "Play music");
                } else {
                    iconPlay.classList.add('icon-hide');
                    iconPause.classList.remove('icon-hide');
                    playPauseBtn.setAttribute('aria-label', "Pause music");
                }
            }
            playPauseBtn.addEventListener('click', function () {
                if (music.paused) {
                    music.play();
                } else {
                    music.pause();
                }
            });
            music.addEventListener('play', updateMusicBtn);
            music.addEventListener('pause', updateMusicBtn);
            // Try autoplay on load
            music.play().catch(function () {
                var startMusic = function () {
                    music.play();
                    document.removeEventListener('click', startMusic);
                    document.removeEventListener('touchstart', startMusic);
                }
                document.addEventListener('click', startMusic);
                document.addEventListener('touchstart', startMusic);
            });
            updateMusicBtn();

            // --- WebGL Heart Effect ---
            var canvas = document.getElementById("canvas");
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            var gl = canvas.getContext('webgl');
            if (gl) {
                var vertexSource = `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }`;
                var fragmentSource = `
        precision highp float;
        uniform float width;
        uniform float height;
        vec2 resolution = vec2(width, height);
        uniform float time;
        #define POINT_COUNT 8
        vec2 points[POINT_COUNT];
        const float speed = -0.5;
        const float len = 0.25;
        float intensity = 1.3;
        float radius = 0.008;
        float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C){
           vec2 a = B - A;
           vec2 b = A - 2.0*B + C;
           vec2 c = a * 2.0;
           vec2 d = A - pos;
           float kk = 1.0 / dot(b,b);
           float kx = kk * dot(a,b);
           float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
           float kz = kk * dot(d,a);
           float res = 0.0;
           float p = ky - kx*kx;
           float p3 = p*p*p;
           float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
           float h = q*q + 4.0*p3;
           if(h >= 0.0){
             h = sqrt(h);
             vec2 x = (vec2(h, -h) - q) / 2.0;
             vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
             float t = uv.x + uv.y - kx;
             t = clamp( t, 0.0, 1.0 );
             vec2 qos = d + (c + b*t)*t;
             res = length(qos);
           }else{
             float z = sqrt(-p);
             float v = acos( q/(p*z*2.0) ) / 3.0;
             float m = cos(v);
             float n = sin(v)*1.732050808;
             vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
             t = clamp( t, 0.0, 1.0 );
             vec2 qos = d + (c + b*t.x)*t.x;  float dis = dot(qos,qos); res = dis;
             qos = d + (c + b*t.y)*t.y;  dis = dot(qos,qos); res = min(res,dis);
             qos = d + (c + b*t.z)*t.z;  dis = dot(qos,qos); res = min(res,dis);
             res = sqrt( res );
           }
           return res;
        }
        vec2 getHeartPosition(float t){
          return vec2(16.0 * sin(t) * sin(t) * sin(t),
                      -(13.0 * cos(t) - 5.0 * cos(2.0*t) - 2.0 * cos(3.0*t) - cos(4.0*t)));
        }
        float getGlow(float dist, float radius, float intensity){
            return pow(radius/dist, intensity);
        }
        float getSegment(float t, vec2 pos, float offset, float scale){
          for(int i = 0; i < POINT_COUNT; i++){
            points[i] = getHeartPosition(offset + float(i)*len + fract(speed * t) * 6.28);
          }
          vec2 c = (points[0] + points[1]) / 2.0;
          vec2 c_prev;
          float dist = 10000.0;
          for(int i = 0; i < POINT_COUNT-1; i++){
            c_prev = c;
            c = (points[i] + points[i+1]) / 2.0;
            dist = min(dist, sdBezier(pos, scale * c_prev, scale * points[i], scale * c));
          }
          return max(0.0, dist);
        }
        void main(){
          vec2 uv = gl_FragCoord.xy/resolution.xy;
          float widthHeightRatio = resolution.x/resolution.y;
          vec2 centre = vec2(0.5, 0.5);
          vec2 pos = centre - uv;
          pos.y /= widthHeightRatio;
          pos.y += 0.02;
          float scale = 0.000015 * height;
          float t = time;
          float dist = getSegment(t, pos, 0.0, scale);
          float glow = getGlow(dist, radius, intensity);
          vec3 col = vec3(0.0);
          col += 10.0*vec3(smoothstep(0.003, 0.001, dist));
          col += glow * vec3(1.0,0.05,0.3);
          dist = getSegment(t, pos, 3.4, scale);
          glow = getGlow(dist, radius, intensity);
          col += 10.0*vec3(smoothstep(0.003, 0.001, dist));
          col += glow * vec3(0.1,0.4,1.0);
          col = 1.0 - exp(-col);
          col = pow(col, vec3(0.4545));
          gl_FragColor = vec4(col,1.0);
        }
        `;
                function compileShader(shaderSource, shaderType) {
                    var shader = gl.createShader(shaderType);
                    gl.shaderSource(shader, shaderSource);
                    gl.compileShader(shader);
                    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                        throw "Shader compile failed with: " + gl.getShaderInfoLog(shader);
                    }
                    return shader;
                }
                function getAttribLocation(program, name) {
                    var attributeLocation = gl.getAttribLocation(program, name);
                    if (attributeLocation === -1) throw 'Cannot find attribute ' + name + '.';
                    return attributeLocation;
                }
                function getUniformLocation(program, name) {
                    var location = gl.getUniformLocation(program, name);
                    if (location === -1) throw 'Cannot find uniform ' + name + '.';
                    return location;
                }
                var vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
                var fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);
                var program = gl.createProgram();
                gl.attachShader(program, vertexShader);
                gl.attachShader(program, fragmentShader);
                gl.linkProgram(program);
                gl.useProgram(program);
                var vertexData = new Float32Array([
                    -1.0, 1.0, -1.0, -1.0,
                    1.0, 1.0, 1.0, -1.0
                ]);
                var vertexDataBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
                var positionHandle = getAttribLocation(program, 'position');
                gl.enableVertexAttribArray(positionHandle);
                gl.vertexAttribPointer(positionHandle, 2, gl.FLOAT, false, 2 * 4, 0);
                var timeHandle = getUniformLocation(program, 'time');
                var widthHandle = getUniformLocation(program, 'width');
                var heightHandle = getUniformLocation(program, 'height');
                gl.uniform1f(widthHandle, canvas.width);
                gl.uniform1f(heightHandle, canvas.height);
                window.addEventListener('resize', function () {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    gl.viewport(0, 0, canvas.width, canvas.height);
                    gl.uniform1f(widthHandle, window.innerWidth);
                    gl.uniform1f(heightHandle, window.innerHeight);
                }, false);
                var lastFrame = Date.now();
                var thisFrame;
                var time = 0.0;
                function draw() {
                    thisFrame = Date.now();
                    time += (thisFrame - lastFrame) / 1000;
                    lastFrame = thisFrame;
                    gl.uniform1f(timeHandle, time);
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                    requestAnimationFrame(draw);
                }
                draw();
            }
        });
        // Add required CSS Keyframes dynamically
        var style = document.createElement('style');
        style.innerHTML = `
      @-webkit-keyframes spin {from{transform:rotateY(0deg);}to{transform:rotateY(360deg);}}
      @keyframes spin {from{transform:rotateY(0deg);}to{transform:rotateY(360deg);}}
      @-webkit-keyframes spinRevert {from{transform:rotateY(360deg);}to{transform:rotateY(0deg);}}
      @keyframes spinRevert {from{transform:rotateY(360deg);}to{transform:rotateY(0deg);}}
    `;
        document.head.appendChild(style);