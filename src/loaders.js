phina.define('nfc.asset.ThreeJSON', {
	superClass: 'phina.asset.Asset',

	data: null,

	init: function() {this.superInit();},

	_load: function(resolve) {
		var self = this;
		new THREE.JSONLoader().load(this.src, function(geometry, materials) {
			self.data = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
			resolve(self);
		});
	},
	get: function() {return this.data.clone();}
});

phina.define('nfc.asset.ThreeTexture', {
	superClass: 'phina.asset.Asset',

	_asset: null,

	init: function() {this.superInit();},

	_load: function(resolve) {
		var self = this;
		new THREE.TextureLoader().load(this.src, function(texture) {
			self._asset = texture;
			resolve(self);
		});
	},

	get: function() {
		var clone = this._asset.clone();
		clone.needsUpdate = true;
		return clone;
	}
});

phina.define('nfc.asset.ThreeCubeTex', {
	superClass: 'phina.asset.Asset',

	_asset: null,

	init: function() {this.superInit();},

	_load: function(resolve) {
		var self = this;
		var src = this.src.split(' ', 2);
		var imgs = [];
		for (i = 0; i < 6; i++) {
			imgs[i] = src[0] + i + src[1];
		}
		new THREE.CubeTextureLoader().load(imgs, function(texture) {
			var cubeShader = THREE.ShaderLib["cube"];
			cubeShader.uniforms["tCube"].value = texture;
			self._asset = new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000),
				new THREE.ShaderMaterial({fragmentShader: cubeShader.fragmentShader,
				vertexShader: cubeShader.vertexShader, uniforms: cubeShader.uniforms, depthWrite: false,
				side: THREE.BackSide}));
			resolve(self);
		});
	},

	get: function() {return this._asset.clone();}
});

phina.define('nfc.asset.Text', {
	superClass: 'phina.asset.Asset',

	_asset: null,

	init: function() {this.superInit();},

	_load: function(resolve) {
		var self = this;
		var ajax = new XMLHttpRequest();
		ajax.open('GET', this.src);
		ajax.onreadystatechange = function() {
			if (ajax.readyState === 4) {
				if ([200, 201, 0].indexOf(ajax.status) !== -1) {
					self._asset = ajax.response;
					resolve(self);
				} else {
					self.loadError = true;
					self.flare('loaderror');
					if (ajax.status === 404) {
						// not found
						self.notFound	= true;
						self.flare('notfound');
					} else {
						// �T�[�o�[�G���[
						self.serverError = true;
						self.flare('servererror');
					}
					reject(self);
				}
			}
		}
		ajax.send(null);
	},

	get: function() {return this._asset;}
});

phina.define('nfc.asset.JSON', {
	superClass: 'phina.asset.Asset',

	_asset: {},

	init: function() {this.superInit();},

	_load: function(resolve) {
		var self = this;
		var json = nfc.asset.Text();
		json.load(this.src).then(function() {
			this._asset = JSON.parse(json.get());
			resolve(self);
		}.bind(this))
	},

	get: function() {return this._asset;}
});

phina.define('nfc.asset.Stage', {
	superClass: 'phina.asset.Asset',

	data: [],

	init: function() {this.superInit();},

	_load: function(resolve) {
		var self = this;
		var json = nfc.asset.JSON();
		json.load(this.src).then(function() {
			var stage = json.get();
			for(var i = 0; i < stage.enemys.length; i++) {
				stage.enemys[i].$safe({
					position: {}, rotation: {}, option: {}, autospawn: {}, random: {}
				});
				stage.enemys[i].position.$safe({x: 0, y: 0, z: 0});
				stage.enemys[i].rotation.$safe({x: 0, y: 0, z: 0, cx: 0, cy: 0, cz: 0});
				stage.enemys[i].autospawn.$safe({time: 0, progress: 0});
				stage.enemys[i].option.$safe({
					position: new THREE.Vector3(stage.enemys[i].position.x, stage.enemys[i].position.y, stage.enemys[i].position.z),
					quaternion: new THREE.Quaternion().rotate(stage.enemys[i].rotation.x, stage.enemys[i].rotation.y, stage.enemys[i].rotation.z),
					c: new THREE.Quaternion().rotate(stage.enemys[i].rotation.cx, stage.enemys[i].rotation.cy, stage.enemys[i].rotation.cz)
				});
			}
			for(var i = 0; i < stage.winds.length; i++) {
				stage.winds[i].$safe({v: 0.2, x: 0, y: 0, color: [0, 0, 0]});
				stage.winds[i].position = new THREE.Vector2(stage.winds[i].x, stage.winds[i].y);
				stage.winds[i].c = stage.winds[i].color[0] << 16 | stage.winds[i].color[1] << 8 | stage.winds[i].color[2];
			}
			stage.goal.$safe({x: 0, y: 0, z: 0, size: 100})
			this.data = stage;
			resolve(self);
		}.bind(this))
	},

	get: function() {return this.data;}
});

phina.asset.AssetLoader.assetLoadFunctions.threejson = function(key, path) {
	var asset = nfc.asset.ThreeJSON();
	var flow = asset.load(path);
	return flow;
};

phina.asset.AssetLoader.assetLoadFunctions.threetexture = function(key, path) {
	var asset = nfc.asset.ThreeTexture();
	var flow = asset.load(path);
	return flow;
};

phina.asset.AssetLoader.assetLoadFunctions.threecubetex = function(key, path) {
	var asset = nfc.asset.ThreeCubeTex();
	var flow = asset.load(path);
	return flow;
};

phina.asset.AssetLoader.assetLoadFunctions.text = function(key, path) {
	var asset = nfc.asset.Text();
	var flow = asset.load(path);
	return flow;
};

phina.asset.AssetLoader.assetLoadFunctions.json = function(key, path) {
	var asset = nfc.asset.JSON();
	var flow = asset.load(path);
	return flow;
};

phina.asset.AssetLoader.assetLoadFunctions.stage = function(key, path) {
	var asset = nfc.asset.Stage();
	var flow = asset.load(path);
	return flow;
};
