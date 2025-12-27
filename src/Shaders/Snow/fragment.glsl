uniform vec3 uColor;
uniform float uOpacity;
uniform sampler2D uTexture;

void main() {
    float snowflakeAlpha = texture2D(uTexture, gl_PointCoord).r;

    snowflakeAlpha = smoothstep(0.0, 1.0, snowflakeAlpha);
    snowflakeAlpha *= uOpacity * 2.0;

    gl_FragColor = vec4(uColor, snowflakeAlpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}