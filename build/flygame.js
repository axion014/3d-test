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

phina.define('fly.SimpleUpdater', {
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


phina.define('fly.DirectionShape', {
	superClass: 'phina.display.Shape',

	init: function(options) {
		options = ({}).$safe(options, {
			backgroundColor: 'transparent',
			fill: '#ff5050',
			stroke: '#aaa',
			strokeWidth: 2,

			width: 16,
			height: 32
		});
		this.superInit(options);
	},

	render: function(canvas) {
		canvas.clearColor(this.backgroundColor);
		canvas.transformCenter();

		if (this.fill) {
			canvas.fillStyle = this.fill;
			canvas.beginPath();
			canvas.moveTo(0, this.height);
			canvas.lineTo(this.width, -this.height);
			canvas.lineTo(-this.width, -this.height);
			canvas.closePath();
			canvas.fill();
		}

		if (this.isStrokable()) {
			canvas.lineWidth = this.strokeWidth;
			canvas.strokeStyle = this.stroke;
			canvas.beginPath();
			canvas.moveTo(0, this.height);
			canvas.lineTo(this.width, -this.height);
			canvas.lineTo(-this.width, -this.height);
			canvas.closePath();
			canvas.stroke();
		}
	},
});

phina.define('fly.asset.ThreeJSON', {
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

phina.define('fly.asset.ThreeTexture', {
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

phina.define('fly.asset.ThreeCubeTex', {
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

phina.define('fly.asset.Text', {
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

phina.define('fly.asset.JSON', {
	superClass: 'phina.asset.Asset',

	_asset: {},

	init: function() {this.superInit();},

	_load: function(resolve) {
		var self = this;
		var json = fly.asset.Text();
		json.load(this.src).then(function() {
			this._asset = JSON.parse(json.get());
			resolve(self);
		}.bind(this))
	},

	get: function() {return this._asset;}
});

phina.define('fly.asset.Stage', {
	superClass: 'phina.asset.Asset',

	data: [],

	init: function() {this.superInit();},

	_load: function(resolve) {
		var self = this;
		var json = fly.asset.JSON();
		json.load(this.src).then(function() {
			var stage = json.get();
			stage.$safe({enemys: [], winds: [], messages: [], goal: {}});
			for(var i = 0; i < stage.enemys.length; i++) {
				stage.enemys[i].$safe({
					position: {}, rotation: {}, option: {}, autospawn: {}, random: {}, killmes: {}
				});
				stage.enemys[i].position.$safe({x: 0, y: 0, z: 0});
				stage.enemys[i].rotation.$safe({x: 0, y: 0, z: 0, cx: 0, cy: 0, cz: 0});
				stage.enemys[i].autospawn.$safe({time: 0, progress: 0, random: {}});
				stage.enemys[i].autospawn.random.$safe({x: 0, y: 0, z: 0});
				stage.enemys[i].killmes.$safe({time: 0, text: ''});
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
			for(var i = 0; i < stage.messages.length; i++) {stage.messages[i].$safe({time: 0, text: ''});}
			stage.goal.$safe({x: 0, y: 0, z: 0, size: 100})
			this.data = stage;
			resolve(self);
		}.bind(this))
	},

	get: function() {return this.data;}
});

phina.asset.AssetLoader.assetLoadFunctions.threejson = function(key, path) {
	var asset = fly.asset.ThreeJSON();
	var flow = asset.load(path);
	return flow;
};

phina.asset.AssetLoader.assetLoadFunctions.threetexture = function(key, path) {
	var asset = fly.asset.ThreeTexture();
	var flow = asset.load(path);
	return flow;
};

phina.asset.AssetLoader.assetLoadFunctions.threecubetex = function(key, path) {
	var asset = fly.asset.ThreeCubeTex();
	var flow = asset.load(path);
	return flow;
};

phina.asset.AssetLoader.assetLoadFunctions.text = function(key, path) {
	var asset = fly.asset.Text();
	var flow = asset.load(path);
	return flow;
};

phina.asset.AssetLoader.assetLoadFunctions.json = function(key, path) {
	var asset = fly.asset.JSON();
	var flow = asset.load(path);
	return flow;
};

phina.asset.AssetLoader.assetLoadFunctions.stage = function(key, path) {
	var asset = fly.asset.Stage();
	var flow = asset.load(path);
	return flow;
};

fly.colCup2D3 = function(p1, p2, v1, v2, r) {
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

phina.define('fly.EffectManager', {
	superClass: 'fly.SimpleUpdater',

	init: function(ts) {
		this.superInit();
		this.explodeManager = fly.ExplodeManager(ts).addChildTo(this);
		this.rayManager = fly.RayManager(ts).addChildTo(this);
		this.threescene = ts;
	},

	explode: function(p, s, t) {return this.explodeManager.explode(p, s, t);},
	ray: function(g, c, o, w, mw, t) {return this.rayManager.ray(g, c, o, w, mw, t);},
});

phina.define('fly.ExplodeManager', {
	superClass: 'fly.SimpleUpdater',

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

phina.define('fly.RayManager', {
	superClass: 'fly.SimpleUpdater',

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

phina.define('fly.EnemyManager', {
	superClass: 'fly.SimpleUpdater',

	definedenemy: [],
	enemyraders: [],
	groups: [],

	init: function(s, ts, bh, ms) {
		this.superInit();
		this.scene = s;
		this.threescene = ts;
		this.gauge_boss_h = bh;
		this.message = ms;
		this.effectmanager = new fly.EffectManager(ts).addChildTo(this);
	},

	defineEnemy: function(n) {
		this.definedenemy[n] = {mesh: phina.asset.AssetManager.get('threejson', n).get(), routine: this.enemys[n].routine.$safe({
			hp: 5, size: 1, v: 0, c: new THREE.Quaternion(), time: 0, update: function(){}
		}), autospawn: (this.enemys[n].autospawn || {}).$safe({rep: 1, options: {}})};
	},
	createEnemy: function(n, r, g, t, p) {
		if(p) {
			var callfunc = function(e) {
				if (e.progress > p) {
					this.createEnemy(n, r, g, t);
					this.off('frame', callfunc);
				}
			}.bind(this);
			this.on('frame', callfunc);
		} else if (t) {
			this.on('frame' + (this.scene.frame + t), function() {this.createEnemy(n, r, g);}.bind(this));
		} else {
			var enemy = this.definedenemy[n].mesh.clone();
			THREE.$extend(enemy, this.definedenemy[n].routine);
			THREE.$extend(enemy, r);
			enemy.group = g;
			this.threescene.add(enemy);
			this.elements.push(enemy);
			var rader = phina.display.CircleShape({radius: 3, fill: 'hsla(0, 80%, 60%, 0.5)', stroke: 'hsla(0, 0%, 0%, 0.5)', strokeWidth: 1}).addChildTo(this.scene);
			var xdist = this.flyer.position.x / 15 - enemy.position.x / 15;
			var zdist = this.flyer.position.z / 15 - enemy.position.z / 15;
			var distance = Math.min(Math.sqrt(Math.pow(xdist, 2) + Math.pow(zdist, 2)), 75);
			var angle = Math.atan2(xdist, zdist) - this.flyer.myrot.y + (Math.abs(this.flyer.myrot.x) > Math.PI / 2 && Math.abs(this.flyer.myrot.x) < Math.PI * 1.5 ? Math.PI : 0);
			rader.setPosition(SCREEN_WIDTH - 100 + Math.sin(angle) * distance, SCREEN_HEIGHT - 100 + Math.cos(angle) * distance);
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
	createEnemyMulti: function(n, r, as, km) {
		var autospawn = as.$safe(this.definedenemy[n].autospawn);
		for(var i = 0; i < autospawn.rep; i++) {
			var nr = {position: new THREE.Vector3()};
			THREE.$extend(nr, r);
			this.groups.push({num: autospawn.rep, message: km});
			this.createEnemy(n, nr, this.groups.last, autospawn.time, autospawn.progress);
			if (autospawn.delay) {autospawn.time += autospawn.delay;}
			THREE.$add(r, autospawn.options);
			r.position.add(new THREE.Vector3(
				Math.random() * autospawn.random.x * 2 - autospawn.random.x,
				Math.random() * autospawn.random.y * 2 - autospawn.random.y,
				Math.random() * autospawn.random.z * 2 - autospawn.random.z));
		}
	},

	update: function() {
		for (var i = 0; i < this.count(); i++) {
			this.get(i).update(this);
			var xdist = this.flyer.position.x / 15 - this.get(i).position.x / 15;
			var zdist = this.flyer.position.z / 15 - this.get(i).position.z / 15;
			var distance = Math.min(Math.sqrt(Math.pow(xdist, 2) + Math.pow(zdist, 2)), 75);
			var angle = Math.atan2(xdist, zdist) - this.flyer.myrot.y + (Math.abs(this.flyer.myrot.x) > Math.PI / 2 && Math.abs(this.flyer.myrot.x) < Math.PI * 1.5 ? Math.PI : 0);
			this.enemyraders[i].setPosition(SCREEN_WIDTH - 100 + Math.sin(angle) * distance, SCREEN_HEIGHT - 100 + Math.cos(angle) * distance);
			if (this.get(i).hp <= 0) {
				this.removeEnemy(i);
				i--;
			}
		}
	},

	removeEnemy: function(i) {
		this.effectmanager.explode(this.get(i).position, this.get(i).size, this.get(i).explodeTime);
		this.scene.score += this.get(i).size;
		this.get(i).group.num--;
		if (this.get(i).group.num === 0) {
			var text = this.get(i).group.message.text;
			if (text !== '') {
				this.on('frame' + (this.scene.frame + (this.get(i).group.message.time - 5)), function() {this.message.text = ''}.bind(this));
				this.on('frame' + (this.scene.frame + this.get(i).group.message.time), function() {this.message.text = text}.bind(this));
			}
		}
		this.get(i).parent.remove(this.get(i));
		this.elements.splice(i, 1);
		this.enemyraders[i].remove();
		this.enemyraders.splice(i, 1);
	},

	// Enemys routine
	enemys: {
		enem1: {
			filename: 'enem-1',
			routine: {
				v: 0.6, chase: 0, duration: 100, mindist: 0,
				update: function(em) {
					if (!em.flyer.position.equals(this.position) && this.chase !== 0 && this.mindist !== 0) {
						var dir = em.flyer.position.clone().sub(this.position.clone());
						var spd = this.v * Math.clamp((dir.length() - this.mindist) * 2 / this.mindist, -1, 1);
						dir.normalize();
						this.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(Axis.z.clone().cross(dir).normalize(), Math.acos(Axis.z.clone().dot(dir))), this.chase);
						this.position.addScaledVector(Axis.z.clone().applyQuaternion(this.quaternion).normalize(), spd);
					} else {
						this.position.addScaledVector(Axis.z.clone().applyQuaternion(this.quaternion).normalize(), this.v);
					}
					if (this.time % this.duration === 0) {
						em.enmBulletManager.createBullet({
							position: this.position, quaternion: this.quaternion,
							v: 2, atk: 70
						});
					}
					this.quaternion.rotate(this.c);
					this.time++;
				}
			},
			autospawn: {rep: 6, delay: 15}
		},
		enem2: {
			filename: 'enem-2',
			routine: {
				hp: 45, v: 1, size: 15, chase: 0.1, mindist: 500, duration: 15, explodeTime: 30,
				update: function(em) {
					if (!em.flyer.position.equals(this.position)) {
						var dir = em.flyer.position.clone().sub(this.position.clone());
						var spd = this.v * Math.clamp((dir.length() - this.mindist) * 2 / this.mindist, -1, 1);
						dir.normalize();
						this.quaternion.slerp(new THREE.Quaternion().setFromAxisAngle(Axis.z.clone().cross(dir).normalize(), Math.acos(Axis.z.clone().dot(dir))), this.chase);
						this.position.addScaledVector(Axis.z.clone().applyQuaternion(this.quaternion).normalize(), spd);
					}
					if (this.time % this.duration === 0) {
						em.enmBulletManager.createBullet({
							position: this.position, quaternion: this.quaternion,
							v: 3, size: 1.5, atk: 100
						});
					}
					this.time++;
				}
			}
		},
		enem3: {
			filename: 'enem-3',
			routine: {
				hp: 500, v: 0.25, size: 30, duration: 3, r: 0.1, explodeTime: 30,
				scale: new THREE.Vector3(2, 2, 2),
				update: function(em) {
					this.rotate(this.c);
					var vec = Axis.z.clone().applyQuaternion(this.quaternion).normalize();
					this.rotate(new THREE.Quaternion().setFromAxisAngle(vec, this.r));
					this.position.addScaledVector(Axis.z.clone().applyQuaternion(this.quaternion).normalize(), this.v);
					if (this.time % this.duration === 0) {
						var vecs = this.quaternion.clone().rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, Math.PI / 2));
						em.enmBulletManager.createBullet({
							position: this.position, quaternion: this.quaternion.clone().rotate(new THREE.Quaternion().setFromAxisAngle(vecs, Math.PI * (this.time % (this.duration * 8)) / this.duration / 8)),
							size: 0.5, atk: 50
						});
					}
					this.time++;
				}
			}
		}
	}
});

phina.define('fly.BulletManager', {
	superClass: 'fly.SimpleUpdater',

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

	removeBullet: function(i) {
		this.get(i).parent.remove(this.get(i));
		this.elements.splice(i, 1);
	}
});

phina.define('fly.WindManager', {
	superClass: 'fly.SimpleUpdater',

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

	removeWind: function(i) {
		for (var j = 0; j < this.get(i).winds.length; j++) {
			this.get(i).winds[j].parent.remove(this.get(i).winds[j]);
		}
		this.elements.splice(i, 1);
	}
});

phina.define('fly.LoadingScene', {
	superClass: 'phina.game.LoadingScene',

	init: function(options) {
		options = (options || {}).$safe(fly.LoadingScene.defaults).$safe(phina.game.LoadingScene.defaults);
		this.superInit(options);
		this.gauge.animationTime = options.animationtime;
	},

	_static: {
		defaults: {animationtime: 500},
	},
});

phina.define('fly.SplashLoadingScene', {
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

phina.define('fly.SceneLoadingScene', {
	superClass: 'phina.display.CanvasScene',

	init: function(options) {
		options = (options || {}).$safe(fly.SceneLoadingScene.defaults)
		this.superInit(options);
		this.options = options;
		this.loadprogress = 0;
		this.loadfrequenry = 0;
	},

	load: function(params) {
		this.label = phina.display.Label({
			text: 'Loading... ' + 0 + '%',
			fill: 'hsla(0, 0%, 0%, 0.6)',
			fontSize: 15,
		}).addChildTo(this).setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);
		for(var i = 0; i < params.length; i++) {for(var j = 0; j < params[i].length; j++) {this.loadfrequenry++;}}
		var exec = function() {
			flows = [];
			for(var j = 0; j < params[ii].length; j++) {
				(function() {
					var flow = phina.util.Flow(params[ii][j].bind(this));
					flow.then(function() {
						this.label.text = 'Loading... ' + ++this.loadprogress / this.loadfrequenry * 100 + '%';
						if (this.loadprogress === this.loadfrequenry) {this.removeChild(this.label);}
					}.bind(this));
					flows.push(flow);
				}.bind(this))();
			}
		}.bind(this);
		var ii = 0;
		var flows = [];
		exec();
		for(i = 1; i < params.length; i++) {
			var ii = i;
			phina.util.Flow.all(flows).then(exec);
		}
	}
});

phina.define('fly.TitleScene', {
	superClass: 'phina.game.TitleScene',

	bgbright: 64,

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
		this.on('pointstart', function() {this.clicked = true;});
	},

	update: function() {
		if (this.clicked) {
			if (this.bgbright === 100) {this.exit();}
			this.bgbright += 4;
			this.backgroundColor = 'hsl(200, 80%, ' + this.bgbright + '%)';
		}
	}

});

phina.define('fly.GameOverScene', {
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

phina.define('fly.MainScene', {
	superClass: 'fly.SceneLoadingScene',

	frame: 0,
	stage: 'arcade',
	difficulty: 1,
	progress: 0,
	score: 0,

	init: function(options) {
		if (options.stage) {this.stage = options.stage;}
		if (options.difficulty) {this.difficulty = options.difficulty;}
		this.superInit();
		// Variables
		var layer = phina.display.ThreeLayer({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});

		var map = phina.display.CircleShape({radius: 75, fill: 'hsla(0, 0%, 30%, 0.5)', stroke: null});
		var playerpos = fly.DirectionShape({
			fill: 'hsla(0, 50%, 70%, 0.5)', stroke: 'hsla(0, 0%, 0%, 0.5)', strokeWidth: 1, width: 2.5, height: 4
		});
		var direction = [];

		var gauge_h = phina.ui.Gauge({fill: 'rgba(0, 0, 0, 0)', gaugeColor: 'rgba(255, 64, 64, 0.3)', value: 1000, maxValue: 1000, strokeWidth: 1, width: 128, height: 16});
		var gauge_e = phina.ui.Gauge({fill: 'rgba(0, 0, 0, 0)', gaugeColor: 'rgba(64, 64, 255, 0.3)', value: 1000, maxValue: 1000, strokeWidth: 1, width: 128, height: 16});
		var gauge_boss_h = phina.ui.Gauge({fill: 'rgba(0, 0, 0, 0)', gaugeColor: 'rgba(200, 16, 16, 0.3)', strokeWidth: 1, width: SCREEN_WIDTH / 1.2, height: 16});

		var msgbox = phina.display.RectangleShape({
			fill: 'hsla(0, 0%, 30%, 0.5)', stroke: 'hsla(0, 0%, 30%, 0.25)', strokeWidth: 1, cornerRadius: 5, width: SCREEN_WIDTH / 5, height: SCREEN_HEIGHT / 12});
		var message = phina.display.Label({text: '', fontSize: 23, fill: 'hsla(0, 0%, 0%, 0.6)', align: 'left'});
		var speed = phina.display.Label({text: 'speed: 1', fontSize: 20, fill: 'hsla(0, 0%, 0%, 0.6)'});

		var enemyManager = fly.EnemyManager(this, layer.scene, gauge_boss_h, message);
		var effectManager = enemyManager.effectmanager;
		var enmBulletManager = fly.BulletManager(layer.scene);
		enemyManager.enmBulletManager = enmBulletManager;
		var windManager = fly.WindManager(layer.scene);

		var flyer = phina.asset.AssetManager.get('threejson', 'fighter').get();
		var goal;
		var sky = phina.asset.AssetManager.get('threecubetex', 'skybox').get();
		var plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), new THREE.MeshBasicMaterial({
			map: phina.asset.AssetManager.get('threetexture', 'plane').get()
		}));
		this.load([[
			function(resolve) { // Load Player
				flyer.position.y = 1000;
				flyer.transparent = true;
				flyer.opacity = 0.3;
				flyer.$safe({ // Player control
					speeds: [0.1, 0.25, 0.45, 0.95], myrot: {x: 0, y: 0, z1: 0, z2: 0},
					row: 0, yo: 0, v: 0, s1c: 0, s2c: 0, e: 1000, hp: 1000, speed: 0, ups: 0.00015,
					av: new THREE.Vector3(), sub1id: 0, sub2id: 1,
					update: function(p, k, s) {
						var c = 0;
						this.v += 0.05;
						c = (p.x - SCREEN_CENTER_X);
						this.myrot.z1 += c * 0.00008;
						this.yo += c * 0.00008;
						this.row += (p.y - SCREEN_CENTER_Y) * this.ups;
						if (p.getPointing()) {
							this.e--;
							this.v += this.speeds[this.speed];
						}
						if (k.getKeyDown(68)) {
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
						this.locked = k.getKey(16); // Shift key
						if (k.getKeyDown(16)) {this.lock = Math.abs(this.myrot.x) < Math.PI / 2 || Math.abs(this.myrot.x) > Math.PI * 1.5;}
						if (this.locked ? this.lock : (Math.abs(this.myrot.x) < Math.PI / 2 || Math.abs(this.myrot.x) > Math.PI * 1.5)) {
							if (this.ups < 0.00015) {this.ups += 0.00001;}
							this.myrot.z2 *= 0.95;
						} else {
							if (this.ups > -0.00015) {this.ups -= 0.00001;}
							this.myrot.z2 += (Math.PI - this.myrot.z2) * 0.05;
						}
						this.yo *= 0.95;
						this.row *= 0.9;
						this.v *= 0.98 - Math.abs(c) * 0.00006 - (k.getKey(86) ? 0.05 : 0);

						if (this.e > 0) {
							if (k.getKey(90) && this.s1c === 0) { // Z Key
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
							if (k.getKeyDown(88) && this.s1c === 0) {this.sub[this.sub1id]();} // X Key
							if (k.getKeyDown(67) && this.s2c === 0) {this.sub[this.sub2id]();} // C Key
							if (this.rgl > 0) {
								this.rgl--;
								this.beam(30, 2, 15, 0, s);
							}
							if (this.brl > 0) {
								this.brl--;
								this.beam(25, 3, 25, 30, s);
							}
						}
						if (this.s1c > 0) {this.s1c--;}
						if (this.s2c > 0) {this.s2c--;}
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
							if (fly.colCup2D3(p1, p2, v1, v2, 15 + enmBulletManager.get(i).size)) {
								effectManager.explode(enmBulletManager.get(i).position, enmBulletManager.get(i).size, 10);
								this.hp -= enmBulletManager.get(i).atk * s.difficulty;
								enmBulletManager.removeBullet(i);
							}
						}
						for (var i = 0; i < enemyManager.elements.length; i++) {
							var v1 = Axis.z.clone().applyQuaternion(this.quaternion).setLength(54);
							var v2 = Axis.z.clone().applyQuaternion(enemyManager.get(i).quaternion).setLength(enemyManager.get(i).size);
							var p1 = this.position.clone().sub(v1.clone().multiplyScalar(-0.5));
							var p2 = enemyManager.get(i).position.clone().sub(v2.clone().multiplyScalar(-0.5));
							if (fly.colCup2D3(p1, p2, v1, v2, 15 + enemyManager.get(i).size * 3)) {
								effectManager.explode(enemyManager.get(i).position, enemyManager.get(i).size, 30);
								this.hp -= enemyManager.get(i).hp * 50 * s.difficulty / this.v;
								enemyManager.removeEnemy(i);
							}
						}
					},
					sub: [
						function() {
							if (this.e >= 250) {
								this.s1c = 20;
								this.rgl = 2;
								this.e -= 250;
								effectManager.ray(this, 0xffffff, 0.2, 1, 27, 7);
								effectManager.ray(this, 0x00ffff, 0.2, 2, 27, 5);
								effectManager.ray(this, 0x0000ff, 0.2, 4, 27, 3);
							}
						}.bind(flyer),
						function() {
							if (this.e >= 700) {
								this.s2c = 250;
								this.brl = 17;
								this.e -= 700;
								effectManager.ray(this, 0xffffff, 0.2, 8, 27, 24);
								effectManager.ray(this, 0xffcccc, 0.2, 12, 27, 22);
								effectManager.ray(this, 0xff8888, 0.2, 18, 27, 20);
								effectManager.ray(this, 0xff4444, 0.2, 24, 27, 18);
								effectManager.ray(this, 0xff0000, 0.2, 30, 27, 16);
							}
						}.bind(flyer)
					],
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
			}
		], [
			function(resolve) { // Stage loading
				if (this.stage !== 'arcade') {
					var load = function() {
						var stage = phina.asset.AssetManager.get('stage', this.stage).get();
						for(var i = 0; i < stage.enemys.length; i++) {
							if (!enemyManager.definedenemy[stage.enemys[i].name]) {
								enemyManager.defineEnemy(stage.enemys[i].name);
							}
							enemyManager.createEnemyMulti(stage.enemys[i].name, stage.enemys[i].option, stage.enemys[i].autospawn, stage.enemys[i].killmes);
						}
						for(var i = 0; i < stage.winds.length; i++) {
							windManager.createWind({v: stage.winds[i].v, position: stage.winds[i].position, size: stage.winds[i].size}, stage.winds[i].color);
						}
						for(var i = 0; i < stage.messages.length; i++) {
							if (!stage.messages[i].progress || stage.messages[i].progress < 0.00001) {
								(function() {
									var tmp = i;
									this.on('frame' + (stage.messages[i].time - 5), function() {message.text = '';}.bind(this));
									this.on('frame' + stage.messages[i].time, function() {message.text = stage.messages[tmp].text;}.bind(this));
								}).bind(this)();
							} else {
								(function() {
									var tmp = i;
									var callfunc = function() {
										if (stage.messages[tmp].progress < this.progress) {
											this.on('frame' + (this.frame + stage.messages[tmp].time - 5), function() {message.text = '';}.bind(this));
											this.on('frame' + (this.frame + stage.messages[tmp].time), function() {message.text = stage.messages[tmp].text;}.bind(this));
											this.off('frame', callfunc);
										}
									}.bind(this);
									this.on('frame', callfunc);
								}).bind(this)();
							}
						}
						var material = new THREE.ShaderMaterial({
							transparent: true,
							uniforms: {
								tExplosion: {type: "t", value: phina.asset.AssetManager.get('threetexture', 'goal').get()},
								time: {type: "f", value: 100 * Math.random()}, alpha: {type: "f", value: 1.0}
							},
							vertexShader: phina.asset.AssetManager.get('text', 'goalvertexshader').get(),
							fragmentShader: phina.asset.AssetManager.get('text', 'expfragshader').get()
						});
						goal = new THREE.Mesh(new THREE.IcosahedronGeometry(stage.goal.size, 2), material).$safe({
							update: function() {material.uniforms.time.value += 0.005 * Math.random();}
						});
						goal.move(new THREE.Vector3(stage.goal.x, stage.goal.y, stage.goal.z));
						layer.scene.add(goal);
						var xdist = flyer.position.x / 15 - goal.position.x / 15;
						var zdist = flyer.position.z / 15 - goal.position.z / 15;
						var distance = Math.min(Math.sqrt(Math.pow(xdist, 2) + Math.pow(zdist, 2)), 75);
						var angle = Math.atan2(xdist, zdist) - flyer.myrot.y + (Math.abs(flyer.myrot.x) > Math.PI / 2 && Math.abs(flyer.myrot.x) < Math.PI * 1.5 ? Math.PI : 0);
						goalrader = phina.display.CircleShape({radius: 5, fill: 'hsla(190, 100%, 70%, 0.5)', stroke: 'hsla(0, 0%, 0%, 0.5)', strokeWidth: 1})
							.setPosition(SCREEN_WIDTH - 100 + Math.sin(angle) * distance, SCREEN_HEIGHT - 100 + Math.cos(angle) * distance);
						resolve();
					}.bind(this);
				}
				if (!phina.asset.AssetManager.get('stage', this.stage)) {
					var loader = phina.asset.AssetLoader();
					var asset = {stage: {}};
					asset.stage[this.stage] = 'data/stages/' + this.stage + '.min.json';
					loader.load(asset).then(function() {
						var stage = phina.asset.AssetManager.get('stage', this.stage).get();
						asset = {threejson: {}};
						for(var i = 0; i < stage.enemys.length; i++) {
							if (!phina.asset.AssetManager.get('threejson', stage.enemys[i].name)) {
								asset.threejson[stage.enemys[i].name] = 'data/models/' + enemyManager.enemys[stage.enemys[i].name].filename + '.min.json';
							}
						}
						loader.onload = load;
						loader.load(asset)
					}.bind(this));
				} else {
					load();
					resolve();
				}
			}
		], [
			function(resolve) { // Screen Setup
				layer.addChildTo(this);
				map.addChildTo(this).setPosition(SCREEN_WIDTH - 100, SCREEN_HEIGHT - 100);
				playerpos.addChildTo(this).setPosition(SCREEN_WIDTH - 100, SCREEN_HEIGHT - 100);
				playerpos.rotation = 180;

				for(var i = 0; i < 4; i++) {
					direction[i] = fly.DirectionShape({
						fill: 'hsla(0, {0}%, {1}%, 0.5)'.format(i === 0 ? 40 : 0, (i === 0 ? 10 : 0) + 10), stroke: null, width: 12, height: 7.5
					}).addChildTo(this)
						.setPosition(SCREEN_WIDTH - 100 - 75 * Math.sin(i * Math.PI / 2), SCREEN_HEIGHT - 100 - 75 * Math.cos(i * Math.PI / 2));
					direction[i].rotation = -i * 90;
				}

				gauge_h.addChildTo(this).setPosition(80, SCREEN_HEIGHT - 100);
				gauge_h.animation = false;
				gauge_e.addChildTo(this);
				gauge_e.animation = false;
				gauge_e.setPosition(80, SCREEN_HEIGHT - 80);
				if (this.stage !== 'arcade') {
					goalrader.addChildTo(this);
					gauge_boss_h.addChildTo(this).setPosition(SCREEN_CENTER_X, 20);
					gauge_boss_h.alpha = 0;
					gauge_boss_h.animation = false;
					msgbox.addChildTo(this).setPosition(0, SCREEN_HEIGHT);
					msgbox.live = 0;
					message.addChildTo(this).setPosition(0, SCREEN_HEIGHT);
				}

				speed.addChildTo(this).setPosition(SCREEN_CENTER_X, SCREEN_HEIGHT - 20);

				enemyManager.addChildTo(this);
				enmBulletManager.addChildTo(this);
				windManager.addChildTo(this);
				resolve();
			}, function(resolve) { // Stage Setup
				var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
				directionalLight.position.set(0, 0, 30);
				plane.rotate(-Math.PI / 2, 0, 0);
				layer.scene.add(directionalLight);
				layer.scene.add(new THREE.AmbientLight(0x606060));
				layer.scene.add(flyer);
				layer.scene.add(sky);
				layer.scene.add(plane);
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
							}, {random: {x: 5, y: 5, z: 5}});
						}
						this.difficulty += 0.0001;
						if (enemyManager.count() > 50) {enemyManager.removeEnemy(0);}
					} else {
						this.progress = flyer.position.clone().dot(goal.position) / goal.position.clone().dot(goal.position);
						var xdist = flyer.position.x / 15 - goal.position.x / 15;
						var zdist = flyer.position.z / 15 - goal.position.z / 15;
						var distance = Math.min(Math.sqrt(Math.pow(xdist, 2) + Math.pow(zdist, 2)), 75);
						var angle = Math.atan2(xdist, zdist) - flyer.myrot.y + (Math.abs(flyer.myrot.x) > Math.PI / 2 && Math.abs(flyer.myrot.x) < Math.PI * 1.5 ? Math.PI : 0);
						goalrader.setPosition(SCREEN_WIDTH - 100 + Math.sin(angle) * distance, SCREEN_HEIGHT - 100 + Math.cos(angle) * distance);
						enemyManager.flare('frame', {progress: this.progress});
						this.flare('frame');
					}
					for (var i = 0; i < enemyManager.elements.length; i++) {
						if (enemyManager.get(i).position.clone().sub(flyer.position).length > 2000) {
							enemyManager.removeEnemy(i);
						}
					}
					for (var i = 0; i < enmBulletManager.elements.length; i++) {
						if (enmBulletManager.get(i).position.clone().sub(flyer.position).length > 800) {
							enmBulletManager.removeBullet(i);
						}
					}

					this.flare('frame' + this.frame);
					enemyManager.flare('frame' + this.frame);
					flyer.update(p, k, this);
					sky.update();
					plane.update();
					goal.update();
					windManager.flyerposy = flyer.position.y;

					for(var i = 0; i < 4; i++) {
						var reverse = (Math.abs(flyer.myrot.x) > Math.PI / 2 && Math.abs(flyer.myrot.x) < Math.PI * 1.5 ? 1 : 0)
						direction[i].setPosition(SCREEN_WIDTH - 100 - 75 * Math.sin(i * Math.PI / 2 - flyer.myrot.y + reverse * Math.PI),
							SCREEN_HEIGHT - 100 - 75 * Math.cos(i * Math.PI / 2 - flyer.myrot.y + reverse * Math.PI));
						direction[i].rotation = -i * 90 + flyer.myrot.y / Math.PI * 180 + reverse * 180;
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

					if (k.getKeyDown(90)) {message.text = '';}
					if (message.text !== '') {
						if (msgbox.live < 0.99999) {
							msgbox.live += 0.5;
							msgbox.setPosition(SCREEN_CENTER_X * msgbox.live, SCREEN_HEIGHT - SCREEN_CENTER_Y * 0.3 * msgbox.live);
							msgbox.width = SCREEN_WIDTH / 10 + SCREEN_WIDTH / 1.3 * msgbox.live;
							msgbox.height = SCREEN_HEIGHT / 12 + SCREEN_HEIGHT / 8 * msgbox.live;
							message.setPosition(SCREEN_CENTER_X  * 0.2 * msgbox.live, SCREEN_HEIGHT - SCREEN_CENTER_Y * 0.3 * msgbox.live);
						}
					} else if (msgbox.live > 0.00001) {
						msgbox.live -= 0.5;
						msgbox.setPosition(SCREEN_CENTER_X * msgbox.live, SCREEN_HEIGHT - SCREEN_CENTER_Y * 0.3 * msgbox.live);
						msgbox.width = SCREEN_WIDTH / 10 + SCREEN_WIDTH / 1.3 * msgbox.live;
						msgbox.height = SCREEN_HEIGHT / 12 + SCREEN_HEIGHT / 5 * msgbox.live;
						message.setPosition(SCREEN_CENTER_X * 0.2 * msgbox.live, SCREEN_HEIGHT - SCREEN_CENTER_Y * 0.3 * msgbox.live);
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
		]]);
	}
});

phina.define('fly.MainSequence', {
	superClass: 'phina.game.ManagerScene',
	init: function() {
		this.superInit({
			scenes: [
				{
					className: 'fly.LoadingScene',
					arguments: {
						lie: false,
						assets: {
							threejson: {
								fighter: 'data/models/fighter-1.min.json',
								bullet: 'data/models/bullet.min.json'
							},
							threetexture: {
								explode: 'data/images/explosion.png',
								goal: 'data/images/goal.png',
								plane: 'data/images/3.png'
							},
							threecubetex: {
								skybox: 'data/images/skybox/ .png'
							},
							text: {
								expvertexshader: 'data/glsl/expvertexshader.min.glsl',
								expfragshader: 'data/glsl/expfragshader.min.glsl',
								goalvertexshader: 'data/glsl/goalvertexshader.min.glsl'
							}
						}
					}
				},

				{
					label: 'title',
					className: 'fly.TitleScene',
					arguments: {
						title: 'flight game',
						message: 'Click start',
						fontColor: '#fff',
						exitType: 'click'
					}
				},
				{
					label: 'main',
					className: 'fly.MainScene',
					arguments: {
						stage: 'tutorial'
					}
				},
				{
					label: 'gameover',
					className: 'fly.GameOverScene'
				}
			],
		});
	}
});

phina.define('fly.Application', {
	superClass: 'phina.display.CanvasApp',
	init: function() {
		this.superInit({
			width: SCREEN_WIDTH,
			height: SCREEN_HEIGHT,
		});
		threeext.extention();
		this.replaceScene(fly.MainSequence());
	},
});

phina.main(function() {
	var app = fly.Application();
	app.run();
});
