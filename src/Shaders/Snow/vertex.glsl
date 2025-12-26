uniform float uTime;
uniform float uSize;
uniform vec2 uResolution;
uniform float uPixelRatio;

attribute float aScale;

varying float vScale;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    
    // Size
    gl_PointSize = uSize * uPixelRatio * uResolution.y;
    gl_PointSize *= aScale; // Apply your scale attribute
    gl_PointSize *= (1.0 / -viewPosition.z); // Perspective
    
    // Optional: Add minimum and maximum sizes
    gl_PointSize = max(gl_PointSize, 0.1);
    gl_PointSize = min(gl_PointSize, 50.0);
    
    vScale = aScale;
}