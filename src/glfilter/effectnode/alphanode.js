phina.namespace(function() {

  phina.define("phina.glfilter.AlphaNode", {
    superClass: "phina.glfilter.ShaderNode",

    init: function(gl, params) {
      this.superInit(gl, params);
    },

		getUniformData: function() {
      return [{
        name: "texture0",
        type: "texture"
      }, {
        name: "color",
        type: "vec4"
      }];
    },

    getShaderSource: function() {
      return [
        "precision mediump float;",

        "uniform sampler2D texture0;",
				"uniform vec4 color;",

        "varying vec2 vUv;",

        "void main(void) {",
        "  vec4 tex = texture2D(texture0, vUv);",
        "  vec3 c = color.rgb * color.a + tex.rgb * (1.0 - color.a);",
        "  gl_FragColor = vec4(c, tex.a);",
        "}",
      ].join("\n");
    },

  });

});
