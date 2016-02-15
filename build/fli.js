var SCREEN_WIDTH = 640;
var SCREEN_CENTER_X = 320;
var SCREEN_HEIGHT = 960;
var SCREEN_CENTER_Y = 480;

//3Ž²
var Axis = {
	x : new THREE.Vector3(1,0,0).normalize(),
	y : new THREE.Vector3(0,1,0).normalize(),
	z : new THREE.Vector3(0,0,1).normalize()
};

threeext = {
	extention: function() {
		THREE.$extend({
			$extend: function(a, o) {
				var arg = Array.prototype.slice.call(arguments);
				arg.shift();
				Array.prototype.forEach.call(arg, function(source) {
					for (var property in source) {
						if (a[property] && o[property] && o[property].className && o[property].className.substr(0, 6) === 'THREE.') {
							a[property].copy(o[property]);
						} else {
							a[property] = o[property];
						}
					}
				}, this);
				return a;
			},
			$add: function(a, o) {
				var arg = Array.prototype.slice.call(arguments);
				arg.shift();
				Array.prototype.forEach.call(arg, function(source) {
					for (var property in source) {
						if (o[property]) {

						} else {
							if (a[property] && o[property] && o[property].className && o[property].className.substr(0, 6) === 'THREE.') {
								a[property].add(o[property]);
							} else {
								a[property] += o[property];
							}
						}
					}
				}, this);
				return a;
			}
		});

		THREE.Mesh.prototype.$safe({
			rotate : function(x, y, z) {this.quaternion.rotate(x, y, z);},

			move : function(d) {
				this.position.x = d.x;
				this.position.y = d.y;
				this.position.z = d.z;
				return this;
			}
		});

		THREE.Vector3.prototype.$safe({
			className: 'THREE.Vector3'
		});

		THREE.Quaternion.prototype.$safe({
			className: 'THREE.Quaternion',
			rotate : function(x, y, z) {
				if (x.className === 'THREE.Quaternion') {
					var qq = x.clone();
					qq.multiply(this.clone());
					this.copy(qq);
				} else {
					this.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, x));
					this.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, y));
					this.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.z, z));
				}
				return this;
			}
		});

		THREE.PerspectiveCamera.prototype.$safe({
			rotate : function(q) {
				var qq = q.clone();
				qq.multiply(this.quaternion.clone());
				this.quaternion.copy(qq);
			},

			move : function(d) {
				this.position.x = d.x;
				this.position.y = d.y;
				this.position.z = d.z;
			}
		});
	}
}

phina.define('nfc.SimpleUpdater', {
	superClass: 'phina.app.Element',

	init: function() {
		this.superInit();
		this.elements = [];
	},

	update: function() {for (var i = 0; i < this.elements.length; i++) {this.elements[i].update();}},
	get: function(i) {return this.elements[i];},
	remove: function(i) {this.elements.splice(i, 1);},
	count: function(i) {return this.elements.length;}
});


phina.define('nfc.DirectionShape', {
	superClass: 'phina.display.Shape',

	init: function(options) {
		options = ({}).$safe(options, {
			backgroundColor: 'transparent',
			fill: '#ff5050',
			stroke: '#aaa',
			strokeWidth: 2,

			radiusshort: 16,
			radiuslong: 32
		});
		this.superInit(options);
	},

	render: function(canvas) {
		canvas.clearColor(this.backgroundColor);
		canvas.transformCenter();

		if (this.fill) {
			canvas.context.fillStyle = this.fill;
			canvas.beginPath();
			canvas.moveTo(0, this.radiuslong);
			canvas.lineTo(this.radiusshort, -this.radiuslong);
			canvas.lineTo(-this.radiusshort, -this.radiuslong);
			canvas.lineTo(0, this.radiuslong);
			canvas.closePath();
			canvas.fill();
		}
		if (this.stroke && 0 < this.strokeWidth) {
			canvas.context.lineWidth = this.strokeWidth;
			canvas.strokeStyle = this.stroke;
			canvas.stroke();
		}
	},
});

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
						// ï¿½Tï¿½[ï¿½oï¿½[ï¿½Gï¿½ï¿½ï¿½[
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

nfc.colCup2D3 = function(p1, p2, v1, v2, r) {
	var t = p2.clone().sub(p1);
	var la = v2.clone().multiplyScalar(v1.clone().dot(v2) / v2.clone().dot(v2)).sub(v1);
	var la2 = la.clone().dot(la);
	if (la2 < 0.00001) {
		var min = p2.clone().sub(p1).length();
		min = Math.min(min, p2.clone().add(v2).sub(p1).length());
		min = Math.min(min, p2.clone().sub(p1.clone().add(v1)).length());
		min = Math.min(min, p2.clone().add(v2).sub(p1.clone().add(v1)).length());
		var p = p2.clone().add(v2.multiplyScalar(t.clone().dot(v2) / v2.clone().dot(v2) * -1));
		var df = Math.min(min, p.sub(p1).length());
	} else {
		var d = v2.clone().dot(v2);
		var a = Math.clamp(la.clone().dot(t.clone().dot(v2) / d * v2.clone().sub(t)) / la2, 0, 1);
		var b = Math.clamp(v1.clone().multiplyScalar(a).sub(t).dot(v2) / d, 0, 1);
		var df = p2.clone().add(v2.clone().multiplyScalar(b)).sub(p1.clone().add(v1.clone().multiplyScalar(a))).length();
	}
	return df <= r;
};

phina.define('nfc.EffectManager', {
	superClass: 'nfc.SimpleUpdater',

	init: function(ts) {
		this.superInit();
		this.explodeManager = nfc.ExplodeManager(ts).addChildTo(this);
		this.rayManager = nfc.RayManager(ts).addChildTo(this);
		this.threescene = ts;
	},

	explode: function(p, s, t) {return this.explodeManager.explode(p, s, t);},
	ray: function(g, c, o, w, mw, t) {return this.rayManager.ray(g, c, o, w, mw, t);},
});

phina.define('nfc.ExplodeManager', {
	superClass: 'nfc.SimpleUpdater',

	init: function(ts) {
		this.superInit();
		this.threescene = ts;
	},

	explode: function(p, s, t) {
		var material = new THREE.ShaderMaterial({
			transparent: true,
			uniforms: {
				tExplosion: {type: "t", value: phina.asset.AssetManager.get('threetexture', 'explode').get()},
				time: {type: "f", value: 100 * Math.random()}, alpha: {type: "f", value: 1.0}
			},
			vertexShader: phina.asset.AssetManager.get('text', 'expvertexshader').get(),
			fragmentShader: phina.asset.AssetManager.get('text', 'expfragshader').get()
		});
		var mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(20, 2), material).$safe({
			time: t, timeMax: t
		}).$safe({
			time: 10, timeMax: 10,
			update: function() {
				this.time--;
				material.uniforms.time.value += 0.015 * Math.random();
				material.uniforms.alpha.value = this.time / this.timeMax;
			}
		});
		mesh.move(p);
		mesh.scale.set(s, s, s);
		this.threescene.add(mesh);
		this.elements.push(mesh);
		return mesh;
	},

	update: function() {
		for (var i = 0; i < this.elements.length; i++) {
			this.get(i).update();
			if (this.get(i).time === 0) {
				this.get(i).parent.remove(this.get(i));
				this.elements.splice(i, 1);
				i--;
			}
		}
	}
});

phina.define('nfc.RayManager', {
	superClass: 'nfc.SimpleUpdater',

	init: function(ts) {
		this.superInit();
		this.threescene = ts;
	},

	ray: function(g, c, o, w, mw, t) {
		var upperSphere = new THREE.Mesh(new THREE.SphereGeometry(w, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2));
		upperSphere.position.set(0, -500, 0);
		var ray = new THREE.Mesh(new THREE.CylinderGeometry(w, w, 1000, 20, 10), new THREE.MeshBasicMaterial({
			color: c, opacity: o, transparent: true
		})).$safe({
			time: t, timeMax: t, generator: g, length: 500 + mw, update:function(){this.time--;}
		});
		ray.geometry.merge(upperSphere.geometry);
		this.threescene.add(ray);
		this.elements.push(ray);
		return ray;
	},

	update: function() {
		for (var i = 0; i < this.count(); i++) {
			this.get(i).update();
			this.get(i).move(this.get(i).generator.position.clone().add(Axis.z.clone().applyQuaternion(
				this.get(i).generator.quaternion).setLength(this.get(i).length)));
			this.get(i).quaternion.copy(new THREE.Quaternion().setFromAxisAngle(Axis.x, Math.PI / 2));
			this.get(i).quaternion.rotate(this.get(i).generator.quaternion);
			if (this.get(i).time === 0) {
				this.get(i).parent.remove(this.get(i));
				this.elements.splice(i, 1);
				i--;
			}
		}
	}
});

phina.define('nfc.EnemyManager', {
	superClass: 'nfc.SimpleUpdater',

	definedenemy: [],
	enemyraders: [],

	init: function(s, ts, bh) {
		this.superInit();
		this.scene = s;
		this.threescene = ts;
		this.gauge_boss_h = bh;
		this.effectmanager = new nfc.EffectManager(ts).addChildTo(this);
	},

	defineEnemy: function(n, r, as) {
		this.definedenemy[n] = {mesh: phina.asset.AssetManager.get('threejson', n).get(), routine: r.$safe({
			hp: 5, size: 1, v: 0, c: new THREE.Quaternion(), time: 0, update: function(){}
		}), autospawn: (as || {}).$safe({rep: 1, options: {}})};
	},
	createEnemy: function(n, r, t, p) {
		if(p) {
			var callfunc = function(e) {
				if (e.progress > p) {
					this.createEnemy(n, r, t);
					this.off('frame', callfunc);
				}
			}.bind(this);
			this.on('frame', callfunc);
		} else if (t) {
			this.on('frame' + t, function() {this.createEnemy(n, r);}.bind(this));
		} else {
			var enemy = this.definedenemy[n].mesh.clone();
			THREE.$extend(enemy, this.definedenemy[n].routine);
			THREE.$extend(enemy, r);
			this.threescene.add(enemy);
			this.elements.push(enemy);
			var rader = phina.display.CircleShape().addChildTo(this.scene);
			rader.radius = 3;
			rader.fill = 'hsla(0, 80%, 60%, 0.5)';
			rader.stroke = 'hsla(0, 0%, 0%, 0.5)';
			rader.strokeWidth = 1;
			rader.setPosition(SCREEN_WIDTH - 100 - this.flyer.position.x / 10 + enemy.position.x / 10,
				SCREEN_HEIGHT - 100 - this.flyer.position.z / 10 + enemy.position.z / 10);
			this.enemyraders.push(rader);
			if (r.boss) {
				this.scene.bosscoming = true;
				this.scene.boss = enemy;
				this.gauge_boss_h.value = enemy.hp;
				this.gauge_boss_h.maxValue = enemy.hp;
			}
			return enemy;
		}
	},
	createEnemyMulti: function(n, r, as) {
		var autospawn = as.$safe(this.definedenemy[n].autospawn);
		for(var i = 0; i < autospawn.rep; i++) {
			this.createEnemy(n, r, autospawn.time, autospawn.progress);
			if (autospawn.delay) {autospawn.time += autospawn.delay;}
			THREE.$add(r, autospawn.options);
			THREE.$add(r, autospawn.random);
		}
	},

	update: function() {
		for (var i = 0; i < this.count(); i++) {
			this.get(i).update();
			var xdist = this.flyer.position.x / 10 - this.get(i).position.x / 10;
			var zdist = this.flyer.position.z / 10 - this.get(i).position.z / 10;
			var distance = Math.sqrt(Math.pow(xdist, 2) + Math.pow(zdist, 2));
			var angle = Math.atan2(xdist, zdist) - this.flyer.myrot.y;
			distance = Math.min(distance, 75);
			this.enemyraders[i].setPosition(SCREEN_WIDTH - 100 + Math.sin(angle) * distance,
				SCREEN_HEIGHT - 100 + Math.cos(angle) * distance);
			if (this.get(i).hp <= 0) {
				this.effectmanager.explode(this.get(i).position, this.get(i).size, this.get(i).explodeTime);
				this.scene.score += this.get(i).size;
				this.remove(i);
				i--;
			}
		}
	},

	remove: function(i) {
		this.get(i).parent.remove(this.get(i));
		this.elements.splice(i, 1);
		this.enemyraders[i].remove();
		this.enemyraders.splice(i, 1);
	}
});

phina.define('nfc.BulletManager', {
	superClass: 'nfc.SimpleUpdater',

	init: function(ts) {
		this.superInit();
		this.threescene = ts;
		this.bullet = phina.asset.AssetManager.get('threejson', 'bullet').get();
	},

	createBullet: function(r) {
		var bullet = this.bullet.clone();
		THREE.$extend(bullet, r).$safe({
			v: 1, size: 1, atk: 1,
			update: function(){
				this.position.addScaledVector(Axis.z.clone().applyQuaternion(this.quaternion).normalize(), this.v);
			}
		});
		this.threescene.add(bullet);
		this.elements.push(bullet);
		return bullet;
	},

	update: function() {for (var i = 0; i < this.count(); i++) {this.get(i).update();}},

	remove: function(i) {
		this.get(i).parent.remove(this.get(i));
		this.elements.splice(i, 1);
	}
});

phina.define('nfc.WindManager', {
	superClass: 'nfc.SimpleUpdater',

	time: 0, flyerposy: 0,

	init: function(ts) {
		this.superInit();
		this.threescene = ts;
	},

	createWind: function(r, c) {
		var wind = {
			v: 0.2, size: 100,
			position: new THREE.Vector2(),
			winds: [], update: function(){}
		}.$extend(r);
		wind.mesh = THREE.$extend(new THREE.Mesh(new THREE.RingGeometry(wind.size - 0.4, wind.size, 50, 5), new THREE.MeshBasicMaterial({
			color: c, side: THREE.DoubleSide
		})), {position: new THREE.Vector3(wind.position.x, 0, wind.position.y)});
		for (var i = -10000 * Math.sign(wind.v); Math.abs(i) <= 10000; i += wind.v * 300) {
			wind.winds.push(wind.mesh.clone());
			wind.winds.last.rotate(Math.PI / 2, 0, 0);
			wind.winds.last.position.y = this.flyerposy + i;
			this.threescene.add(wind.winds.last);
		}
		this.elements.push(wind);
		return wind;
	},

	update: function() {
		for (var i = 0; i < this.count(); i++) {
			if (this.time % 30 === 0) {
				this.get(i).winds.push(this.get(i).mesh.clone());
				this.get(i).winds.last.rotate(Math.PI / 2, 0, 0);
				this.get(i).winds.last.position.y = this.flyerposy - 10000 * Math.sign(this.get(i).v);
				this.threescene.add(this.get(i).winds.last);
			}
			if (this.get(i).winds.first) {
				if (this.get(i).winds.first.parent) {
					if (Math.abs(this.get(i).winds.first.position.y - this.flyerposy) > 10000) {
						this.get(i).winds.first.parent.remove(this.get(i).winds.first);
					}
				}
			}
			for (var j = 0; j < this.get(i).winds.length; j++) {
				this.get(i).winds[j].position.y += this.get(i).v * 10;
			}
		}
		this.time++;
	},

	remove: function(i) {
		for (var j = 0; j < this.get(i).winds.length; j++) {
			this.get(i).winds[j].parent.remove(this.get(i).winds[j]);
		}
		this.elements.splice(i, 1);
	}
});

phina.define('nfc.LoadingScene', {
	superClass: 'phina.game.LoadingScene',

	init: function(options) {
		options = (options || {}).$safe(nfc.LoadingScene.defaults).$safe(phina.game.LoadingScene.defaults);
		this.superInit(options);
		this.gauge.animationTime = options.animationtime;
	},

	_static: {
		defaults: {animationtime: 500},
	},
});

phina.define('nfc.SplashLoadingScene', {
	superClass: 'phina.display.CanvasScene',

	init: function(options) {
		options = (options || {}).$safe(phina.game.LoadingScene.defaults);
		this.superInit(options);
		var texture = phina.asset.Texture();
		texture.load(phina.game.SplashScene.defaults.imageURL).then(function() {
			this.sprite = phina.display.Sprite(this.texture).addChildTo(this);
			this.sprite.setPosition(this.gridX.center(), this.gridY.center());
			this.sprite.alpha = 0;
			this.sprite.tweener.clear()
				.to({alpha:1}, 500, 'easeOutCubic').wait(1000)
				.to({alpha:0}, 500, 'easeOutCubic').wait(250)
				.call(function() {this.sprite.remove();}, this);
		}.bind(this));
		this.texture = texture;
		var loader = phina.asset.AssetLoader();
		loader.onload = function(e) {this.app.popScene();}.bind(this);
		loader.load(options.assets);
	}
});

phina.define('nfc.SceneLoadingScene', {
	superClass: 'phina.display.CanvasScene',

	init: function(options) {
		options = (options || {}).$safe(nfc.SceneLoadingScene.defaults).$safe(phina.game.LoadingScene.defaults);
		this.superInit(options);
		this.fromJSON({
			children: {
				gauge: {
					className: 'phina.ui.Gauge',
					arguments: {
						value: 0,
						width: this.width,
						height: 12,
						fill: '#aaa',
						stroke: false,
						gaugeColor: 'hsla(200, 100%, 80%, 0.8)',
						padding: 0,
						animationTime: options.animationtime
					},
					x: this.gridX.center(),
					y: 0,
					originY: 0,
				}
			}
		});

		this.gauge.onfull = function() {this.removeChild(this.gauge);}.bind(this);
	},

	load: function(params, i) {
		i |= 0;
		var flow = phina.util.Flow(params[i].bind(this));
		flow.then(function() {
			i++;
			this.gauge.value = i / params.length * 100;
			if(i < params.length) {this.load(params, i);}
		}.bind(this));
	},

	_static: {
		defaults: {
			animationtime: 100
		},
	}
});

phina.define('nfc.TitleScene', {
	superClass: 'phina.game.TitleScene',

	init: function(params) {
		this.superInit(params);
		this.fromJSON({
			children: {
				messageLabel: {
					className: 'phina.display.Label',
					arguments: {
						text: params.message,
						fill: params.fontColor,
						stroke: false,
						fontSize: 24,
					},
					x: this.gridX.center(),
					y: this.gridY.span(12),
				}
			}
		});
		this.on('pointstart', function() {this.exit();});
	}

});

phina.define('nfc.GameOverScene', {
	superClass: 'phina.display.CanvasScene',

	init: function(params) {
		this.superInit(params);

		params = (params || {}).$safe(phina.game.ResultScene.defaults);

		var message = params.message.format(params);

		this.backgroundColor = params.backgroundColor;

		this.fromJSON({
			children: {
				scoreText: {
					className: 'phina.display.Label',
					arguments: {
						text: 'score',
						fill: params.fontColor,
						stroke: null,
						fontSize: 48,
					},
					x: this.gridX.center(),
					y: this.gridY.span(4),
				},
				scoreLabel: {
					className: 'phina.display.Label',
					arguments: {
						text: '' + params.score,
						fill: params.fontColor,
						stroke: null,
						fontSize: 72,
					},
					x: this.gridX.center(),
					y: this.gridY.span(6),
				},

				playButton: {
					className: 'phina.ui.Button',
					arguments: [{
						text: 'retry',
						width: 144,
						height: 144,
						fontSize: 45,
						cornerRadius: 72,
					}],
					x: this.gridX.center(),
					y: this.gridY.span(12),

					interactive: true,
					onpush: function() {
						this.exit('main');
					}.bind(this),
				},
			}
		});
	}
});

phina.define('nfc.MainScene', {
	superClass: 'nfc.SceneLoadingScene',

	frame: 0,
	stage: 'arcade',
	difficulty: 1,
	progress: 0,
	score: 0,

	init: function(options) {
		this.superInit();
		if (options.stage) {this.stage = options.stage;}
		if (options.difficulty) {this.difficulty = options.difficulty;}
		var layer;
		var enemyManager, effectManager, enmBulletManager, windManager;
		var flyer, goal, sky, plane;
		var map, playerpos;
		var direction = [];
		var gauge_h, gauge_e, gauge_boss_h;
		var speed;
		this.load([
			function(resolve) { // Screen Setup
				layer = phina.display.ThreeLayer({
					width: SCREEN_WIDTH,
					height: SCREEN_HEIGHT,
				}).addChildTo(this);

				var directionalLight = new THREE.DirectionalLight(0xffffff, 1); //???s????(??, ???x)
				directionalLight.position.set(0, 0, 30);
				layer.scene.add(directionalLight);
				layer.scene.add(new THREE.AmbientLight(0x606060)); // ?????(?O???[)

				map = phina.display.CircleShape().addChildTo(this);
				map.radius = 75;
				map.fill = 'hsla(0, 0%, 30%, 0.5)';
				map.stroke = null;
				map.setPosition(SCREEN_WIDTH - 100, SCREEN_HEIGHT - 100);

				playerpos = nfc.DirectionShape().addChildTo(this);
				playerpos.fill = 'hsla(0, 50%, 70%, 0.5)';
				playerpos.stroke = 'hsla(0, 0%, 0%, 0.5)';
				playerpos.strokeWidth = 1;
				playerpos.radiusshort = 2.5;
				playerpos.radiuslong = 4;
				playerpos.setPosition(SCREEN_WIDTH - 100, SCREEN_HEIGHT - 100);
				playerpos.rotation = 180;

				for(var i = 0; i < 4; i++) {
					direction[i] = nfc.DirectionShape().addChildTo(this);
					if (i === 0) {
						direction[i].fill = 'hsla(0, 40%, 20%, 0.5)';
					} else {
						direction[i].fill = 'hsla(0, 0%, 10%, 0.5)';
					}
					direction[i].stroke = null;
					direction[i].radiusshort = 12;
					direction[i].radiuslong = 7.5;
					direction[i].setPosition(SCREEN_WIDTH - 100 - 75 * Math.sin(i * Math.PI / 2),
						SCREEN_HEIGHT - 100 - 75 * Math.cos(i * Math.PI / 2));
					direction[i].rotation = -i * 90;
				}

				gauge_h = phina.ui.Gauge({
					fill: 'rgba(0, 0, 0, 0)', gaugeColor: 'rgba(255, 64, 64, 0.3)',
					value: 1000, maxValue: 1000, strokeWidth: 1,
					width: 128, height: 16
				}).addChildTo(this);
				gauge_h.animation = false;
				gauge_h.setPosition(80, SCREEN_HEIGHT - 100);

				gauge_e = phina.ui.Gauge({
					fill: 'rgba(0, 0, 0, 0)', gaugeColor: 'rgba(64, 64, 255, 0.3)',
					value: 1000, maxValue: 1000, strokeWidth: 1,
					width: 128, height: 16
				}).addChildTo(this);
				gauge_e.animation = false;
				gauge_e.setPosition(80, SCREEN_HEIGHT - 80);

				gauge_boss_h = phina.ui.Gauge({
					fill: 'rgba(0, 0, 0, 0)', gaugeColor: 'rgba(200, 16, 16, 0.3)',
					strokeWidth: 1, width: SCREEN_WIDTH / 1.2, height: 16
				}).addChildTo(this);
				gauge_boss_h.alpha = 0;
				gauge_boss_h.animation = false;
				gauge_boss_h.setPosition(SCREEN_CENTER_X, 20);

				speed = phina.display.Label({text: 'speed: 1', fontSize: 16}).addChildTo(this);
				speed.setPosition(50, SCREEN_HEIGHT - 20);
				resolve();
			}, function(resolve) { // Managers Setup
				enemyManager = nfc.EnemyManager(this, layer.scene, gauge_boss_h).addChildTo(this);
				effectManager = enemyManager.effectmanager;
				enmBulletManager = nfc.BulletManager(layer.scene).addChildTo(this);
				windManager = nfc.WindManager(layer.scene).addChildTo(this);
				resolve();
			}, function(resolve) { // Load Players
				flyer = phina.asset.AssetManager.get('threejson', 'fighter').get();
				sky = phina.asset.AssetManager.get('threecubetex', 'skybox').get();
				plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), new THREE.MeshBasicMaterial({
					map: phina.asset.AssetManager.get('threetexture', 'plane').get()
				}));
				plane.rotate(-Math.PI / 2, 0, 0);
				flyer.position.y = 1000;
				flyer.transparent = true;
				flyer.opacity = 0.3;
				flyer.$safe({ // Player control
					speeds: [0.15, 0.3, 0.5, 1], myrot: {x: 0, y: 0, z1: 0, z2: 0},
					row: 0, yo: 0, v: 0, rgc: 0, brc: 0, sc: 0, e: 1000, hp: 1000, speed: 0, ups: 0.00015,
					av: new THREE.Vector3(),
					update: function(p, k, s) {
						var c = 0;
						if (p.getPointing()) {
							this.e--;
							this.v += this.speeds[this.speed];
							c = (p.x - SCREEN_CENTER_X);
							this.myrot.z1 += c * 0.00008;
							this.yo += c * 0.00008;
							this.row += (p.y - SCREEN_CENTER_Y) * this.ups;
						}
						if (k.getKeyDown(67)) {
							this.speed++;
							this.speed %= 4;
							speed.text = 'speed: ' + (this.speed + 1);
						}
						this.myrot.x += this.row * 0.1;
						this.myrot.y -= this.yo * 0.1;
						this.myrot.x %= Math.PI * 2;
						this.quaternion.copy(new THREE.Quaternion());
						this.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.z, this.myrot.z1 + this.myrot.z2));
						this.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, this.myrot.x));
						this.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, this.myrot.y));
						this.position.addScaledVector(Axis.z.clone().applyQuaternion(this.quaternion).normalize(), this.v);
						this.position.add(this.av);
						this.av.multiplyScalar(0.98);

						this.myrot.z1 *= 0.95;
						if (k.getKey(16) || Math.abs(this.myrot.x) < Math.PI / 2 || Math.abs(this.myrot.x) > Math.PI * 1.5) {
							if (this.ups < 0.00015) {this.ups += 0.00001;}
							this.myrot.z2 *= 0.95;
						} else {
							if (this.ups > -0.00015) {this.ups -= 0.00001;}
							this.myrot.z2 += (Math.PI - this.myrot.z2) * 0.05;
						}
						this.yo *= 0.95;
						this.row *= 0.9;
						this.v *= 0.98 - Math.abs(c) * 0.00006 - (k.getKey(66) ? 0.05 : 0);

						if (this.e > 0) {
							if (k.getKey(32) && this.sc === 0) {
								this.e -= 2;
								var rnd1 = this.quaternion.clone();
								rnd1.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, Math.random() * 0.06 - 0.03));
								rnd1.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, Math.random() * 0.06 - 0.03));
								var rnd2 = this.quaternion.clone();
								rnd2.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, Math.random() * 0.06 - 0.03));
								rnd2.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, Math.random() * 0.06 - 0.03));
								this.attack(rnd1, s);
								this.attack(rnd2, s);
							}
							if (k.getKeyDown(65) && this.rgc === 0 && this.e >= 250) {
								this.rgc = 20;
								this.rgl = 2;
								this.e -= 250;
								this.beam(40, 2, 15, 0, s);
								effectManager.ray(this, 0xffffff, 0.2, 1, 27, 7);
								effectManager.ray(this, 0x00ffff, 0.2, 2, 27, 5);
								effectManager.ray(this, 0x0000ff, 0.2, 4, 27, 3);
							} else if (this.rgl > 0) {
								this.rgl--;
								this.beam(30, 2, 15, 0, s);
							}
							if (k.getKeyDown(83) && this.brc === 0 && this.e >= 700) {
								this.brc = 250;
								this.brl = 17;
								this.rgc = 80;
								this.sc = 50;
								this.e -= 700;
								this.beam(100, 3, 25, 30, s);
								effectManager.ray(this, 0xffffff, 0.2, 8, 27, 24);
								effectManager.ray(this, 0xffcccc, 0.2, 12, 27, 22);
								effectManager.ray(this, 0xff8888, 0.2, 18, 27, 20);
								effectManager.ray(this, 0xff4444, 0.2, 24, 27, 18);
								effectManager.ray(this, 0xff0000, 0.2, 30, 27, 16);
							} else if (this.brl > 0) {
								this.brl--;
								this.beam(25, 3, 25, 30, s);
							}
						}
						if (this.rgc > 0) {this.rgc--;}
						if (this.brc > 0) {this.brc--;}
						if (this.sc > 0) {this.sc--;}
						gauge_e.value = this.e;
						if (this.e < 1000) {this.e += 4;}
						gauge_h.value = this.hp;

						for (var i = 0; i < windManager.elements.length; i++) {
							var radius = 15 + windManager.get(i).size;
							var df = Math.sqrt(this.position.x * windManager.get(i).position.x + this.position.z * windManager.get(i).position.y);
							if (df <= radius) {this.av.y += windManager.get(i).v / 2;}
						}
						for (var i = 0; i < enmBulletManager.elements.length; i++) {
							var v1 = Axis.z.clone().applyQuaternion(this.quaternion).setLength(54);
							var v2 = Axis.z.clone().applyQuaternion(enmBulletManager.get(i).quaternion).setLength(enmBulletManager.get(i).size);
							var p1 = this.position.clone().sub(v1.clone().multiplyScalar(-0.5));
							var p2 = enmBulletManager.get(i).position.clone().sub(v2.clone().multiplyScalar(-0.5));
							if (nfc.colCup2D3(p1, p2, v1, v2, 15 + enmBulletManager.get(i).size)) {
								effectManager.explode(enmBulletManager.get(i).position, enmBulletManager.get(i).size, 10);
								this.hp -= enmBulletManager.get(i).atk * s.difficulty;
								enmBulletManager.remove(i);
							}
						}
						for (var i = 0; i < enemyManager.elements.length; i++) {
							var v1 = Axis.z.clone().applyQuaternion(this.quaternion).setLength(54);
							var v2 = Axis.z.clone().applyQuaternion(enemyManager.get(i).quaternion).setLength(enemyManager.get(i).size);
							var p1 = this.position.clone().sub(v1.clone().multiplyScalar(-0.5));
							var p2 = enemyManager.get(i).position.clone().sub(v2.clone().multiplyScalar(-0.5));
							if (nfc.colCup2D3(p1, p2, v1, v2, 15 + enemyManager.get(i).size * 3)) {
								effectManager.explode(enemyManager.get(i).position, enemyManager.get(i).size, 30);
								this.hp -= enemyManager.get(i).hp * 50 * s.difficulty / this.v;
								enemyManager.remove(i);
							}
						}
					},
					attack: function(rot, s) {
						var caster = new THREE.Raycaster();
						caster.set(this.position.clone(), Axis.z.clone().applyQuaternion(rot).normalize());
						var hit = caster.intersectObjects(enemyManager.elements);
						if (hit.length !== 0) {
							effectManager.explode(hit[0].point, 1, 10);
							hit[0].object.hp -= 5 / s.difficulty;
						}
					},
					beam: function(atk, exps, expt, radius, s) {
						var vec = Axis.z.clone().applyQuaternion(this.quaternion).normalize();
						if (radius === 0) {
							var hit = new THREE.Raycaster(this.position.clone(), vec).intersectObjects(enemyManager.elements);
						} else {
							var hit = [];
							for (var i = 0; i < enemyManager.elements.length; i++) {
								var l = this.position.clone().add(vec.multiplyScalar(27));
								var p = enemyManager.get(i).position;
								var df = l.addScaledVector(vec, l.clone().sub(p).negate().dot(vec) / vec.clone().dot(vec)).sub(p).length();
								if (df <= radius + enemyManager.get(i).size * 5) {
									hit.push({point: p.clone(), object: enemyManager.get(i)});
								}
							}
						}
						for (var i = 0; i < hit.length; i++) {
							effectManager.explode(hit[i].point, exps, expt);
							hit[i].object.hp -= atk / s.difficulty;
						}
					}
				})
				enemyManager.flyer = flyer;
				sky.update = function() {
					this.move(flyer.position);
				}
				plane.update = function() {
					this.position.x = flyer.position.x;
					this.position.z = flyer.position.z;
				}
				resolve();
			}, function(resolve) { // Load Enemys
				// Enemy creater / Enemy action routine
				enemyManager.defineEnemy('enem1', {
					v: 0.6, duration: 100,
					update: function() {
						this.position.addScaledVector(Axis.z.clone().applyQuaternion(this.quaternion).normalize(), this.v);
						if (this.time % this.duration === 0) {
							enmBulletManager.createBullet({
								position: this.position, quaternion: this.quaternion,
								v: 2, atk: 70
							});
						}
						this.quaternion.rotate(this.c);
						this.time++;
					}
				}, {rep: 6, delay: 15});
				enemyManager.defineEnemy('enem2', {
					hp: 45, v: 1, size: 15, chase: 0.1, mindist: 500, duration: 15, explodeTime: 30,
					update: function() {
						if(!flyer.position.equals(this.position)) {
							var dir = flyer.position.clone().sub(this.position.clone());
							var spd = this.v * Math.clamp((dir.length() - this.mindist) * 2 / this.mindist, -1, 1);
							dir.normalize();
							this.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(Axis.z.clone().cross(dir).normalize(), Math.acos(Axis.z.clone().dot(dir))), this.chase);
							this.position.addScaledVector(dir, spd);
						}
						if (this.time % this.duration === 0) {
							enmBulletManager.createBullet({
								position: this.position, quaternion: this.quaternion,
								v: 3, size: 1.5, atk: 100
							});
						}
						this.time++;
					}
				}, {});
				enemyManager.defineEnemy('enem3', {
					hp: 500, v: 0.25, size: 30, duration: 3, r: 0.1, explodeTime: 30,
					scale: new THREE.Vector3(2, 2, 2),
					update: function() {
						this.rotate(this.c);
						var vec = Axis.z.clone().applyQuaternion(this.quaternion).normalize();
						this.rotate(new THREE.Quaternion().setFromAxisAngle(vec, this.r));
						this.position.addScaledVector(Axis.z.clone().applyQuaternion(this.quaternion).normalize(), this.v);
						if (this.time % this.duration === 0) {
							var vecs = this.quaternion.clone().rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, Math.PI / 2));
							enmBulletManager.createBullet({
								position: this.position, quaternion: this.quaternion.clone().rotate(new THREE.Quaternion().setFromAxisAngle(vecs, Math.PI * (this.time % (this.duration * 8)) / this.duration / 8)),
								size: 0.5, atk: 50
							});
						}
						this.time++;
					}
				}, {});
				resolve();
			}, function(resolve) { // Stage Loading
				if (this.stage !== 'arcade' && (!phina.asset.AssetManager.get('stage', this.stage))) {
					var loader = phina.asset.AssetLoader();
					loader.onload = function(e) {resolve();};
					var asset = {stage: {}};
					asset.stage[this.stage] = 'data/stages/' + this.stage + '.min.json';
					loader.load(asset);
				} else {
					resolve();
				}
			}, function(resolve) { // Stage Setup
				layer.scene.add(flyer);
				layer.scene.add(sky);
				layer.scene.add(plane);

				if (this.stage !== 'arcade') {
					var stage = phina.asset.AssetManager.get('stage', this.stage).get();
					for(var i = 0; i < stage.enemys.length; i++) {
						enemyManager.createEnemyMulti(stage.enemys[i].name, stage.enemys[i].option, stage.enemys[i].autospawn);
					}
					for(var i = 0; i < stage.winds.length; i++) {
						windManager.createWind({v: stage.winds[i].v, position: stage.winds[i].position, size: stage.winds[i].size}, stage.winds[i].color);
					}
					goal = new THREE.Mesh(new THREE.IcosahedronGeometry(stage.goal.size, 2), new THREE.Material());
					goal.move(new THREE.Vector3(stage.goal.x, stage.goal.y, stage.goal.z));
				}
				resolve();
			}, function(resolve) {
				layer.update = function(app) { // Update routine
					var p = app.pointer;
					var k = app.keyboard;
					if (this.stage === 'arcade') { // Arcade mode (random enemy spawn)
						var rand = Math.random();
						if (rand > 0.98 && enemyManager.count() < 100) {
							if (rand < 0.995) {
								var enmname = 'enem1';
							} else if (rand < 0.9975) {
								var enmname = 'enem2';
							} else {
								var enmname = 'enem3';
							}
							enemyManager.createEnemyMulti(enmname, {
								position: new THREE.Vector3(Math.randint(-500, 500), Math.randint(500, 5000), Math.randint(-500, 500)).add(flyer.position),
								quaternion: new THREE.Quaternion().rotate(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2)
							}, {options: {
								position: function() {return new THREE.Vector3(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5)}
							}});
						}
						this.difficulty += 0.0001;
						if (enemyManager.count() > 50) {enemyManager.remove(0);}
					} else {
						this.progress = flyer.position.clone().dot(goal.position) / goal.position.clone().dot(goal.position);
						enemyManager.flare('frame', {progress: this.progress});
					}
					for (var i = 0; i < enemyManager.elements.length; i++) {
						if (enemyManager.get(i).position.clone().sub(flyer.position).length > 2000) {
							enemyManager.remove(i);
						}
					}
					for (var i = 0; i < enmBulletManager.elements.length; i++) {
						if (enmBulletManager.get(i).position.clone().sub(flyer.position).length > 800) {
							enmBulletManager.remove(i);
						}
					}

					enemyManager.flare('frame' + this.frame);
					flyer.update(p, k, this);
					sky.update();
					plane.update();
					windManager.flyerposy = flyer.position.y;

					for(var i = 0; i < 4; i++) {
						direction[i].setPosition(SCREEN_WIDTH - 100 - 75 * Math.sin(i * Math.PI / 2 - flyer.myrot.y),
							SCREEN_HEIGHT - 100 - 75 * Math.cos(i * Math.PI / 2 - flyer.myrot.y));
						direction[i].rotation = -i * 90 + flyer.myrot.y / Math.PI * 180;
					}

					// Camera control
					layer.camera.quaternion.copy(new THREE.Quaternion());
					layer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.z, -flyer.myrot.z2));
					layer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, -flyer.myrot.x));
					layer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, flyer.myrot.y + Math.PI));
					var vec = Axis.z.clone().applyQuaternion(layer.camera.quaternion).negate().setLength(-100);
					layer.camera.position.copy(flyer.position.clone().add(vec));
					layer.camera.updateMatrixWorld();

					if (this.bosscoming) {
						if (this.boss.parent === null) {
							this.bosscoming = false;
						} else {
							gauge_boss_h.value = this.boss.hp;
						}
						if (gauge_boss_h.alpha < 0.99999) {
							gauge_boss_h.alpha += 0.1;
						}
					} else if (gauge_boss_h.alpha > 0.00001) {
						gauge_boss_h.alpha -= 0.1;
					}

					if (flyer.hp <= 0) {
						if (this.stage === 'arcade') {
							this.exit('gameover', {score: this.score});
						} else {
							this.exit('gameover', {score: this.score});
						}
					}

					this.frame++;
				}.bind(this);
				resolve();
			}
		]);
	}
});

phina.define('nfc.MainSequence', {
	superClass: 'phina.game.ManagerScene',
	init: function() {
		this.superInit({
			scenes: [
				{
					className: 'nfc.LoadingScene',
					arguments: {
						lie: false,
						assets: {
							threejson: {
								fighter: 'data/models/fighter-1.min.json',
								enem1: 'data/models/enem-1.min.json',
								enem2: 'data/models/fighter-2.min.json',
								enem3: 'data/models/enem-3.min.json',
								bullet: 'data/models/bullet.min.json'
							},
							threetexture: {
								explode: 'data/explosion.png',
								plane: 'data/3.png'
							},
							threecubetex: {
								skybox: 'data/skybox/ .png'
							},
							text: {
								expvertexshader: 'data/glsl/expvertexshader.min.glsl',
								expfragshader: 'data/glsl/expfragshader.min.glsl'
							},
							stage: {
								tutorial: 'data/stages/tutorial.min.json'
							}
						}
					}
				},

				{
					label: 'title',
					className: 'nfc.TitleScene',
					arguments: {
						title: 'flight game',
						message: 'Click start',
						fontColor: '#fff',
						exitType: 'click'
					}
				},
				{
					label: 'main',
					className: 'nfc.MainScene',
					arguments: {
						stage: 'tutorial'
					}
				},
				{
					label: 'gameover',
					className: 'nfc.GameOverScene'
				}
			],
		});
	}
});

phina.define('nfc.Application', {
	superClass: 'phina.display.CanvasApp',
	init: function() {
		this.superInit({
			width: SCREEN_WIDTH,
			height: SCREEN_HEIGHT,
		});
		threeext.extention();
		this.replaceScene(nfc.MainSequence());
	},
});

phina.main(function() {
	var app = nfc.Application();
	app.run();
});
