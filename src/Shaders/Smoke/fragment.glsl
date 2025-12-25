uniform float uTime;
uniform sampler2D uTexture;
uniform vec3 uSmokeColor;
uniform float uSmokeUvX;
uniform float uSmokeUvY;

varying vec2 vUv;

void main() {

    // Scale and Animate
    vec2 smokeUv = vUv;
    smokeUv.x *= uSmokeUvX;
    smokeUv.y *= uSmokeUvY;
    smokeUv.y -= uTime * 0.03;

    // Smoke
    float smoke = texture2D(uTexture, smokeUv).r;

    // Remap
    smoke = smoothstep(0.4, 1.0, smoke);

    // Edges Fade
    // smoke = 1.0;
    smoke *= smoothstep(0.0, 0.1, vUv.x);
    smoke *= smoothstep(1.0, 0.9, vUv.x);
    smoke *= smoothstep(0.0, 0.1, vUv.y);
    smoke *= smoothstep(1.0, 0.6, vUv.y);

    // Final Color
    gl_FragColor = vec4(uSmokeColor, smoke);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}