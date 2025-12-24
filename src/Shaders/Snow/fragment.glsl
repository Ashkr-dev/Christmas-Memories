uniform vec3 uColor;
uniform float uOpacity;
uniform sampler2D uTexture;

varying float vScale;

void main() {
    float snowflakeAlpha = texture2D(uTexture, gl_PointCoord).r;

    gl_FragColor = vec4(vec3(1.0), snowflakeAlpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}