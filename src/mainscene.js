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
		var layer = phina.display.ThreeLayer({
			width: SCREEN_WIDTH,
			height: SCREEN_HEIGHT,
		}).addChildTo(this);
		var enemyManager, effectManager, enmBulletManager, windManager;
		var flyer, goal, sky, plane;
		var map, playerpos;
		var direction = [];
		var gauge_h, gauge_e, gauge_boss_h;
		var speed;
		this.load([
			function(resolve) { // Screen Setup

				var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
				directionalLight.position.set(0, 0, 30);
				layer.scene.add(directionalLight);
				layer.scene.add(new THREE.AmbientLight(0x606060));

				map = phina.display.CircleShape().addChildTo(this);
				map.radius = 75;
				map.fill = 'hsla(0, 0%, 30%, 0.5)';
				map.stroke = null;
				map.setPosition(SCREEN_WIDTH - 100, SCREEN_HEIGHT - 100);

				playerpos = fly.DirectionShape().addChildTo(this);
				playerpos.fill = 'hsla(0, 50%, 70%, 0.5)';
				playerpos.stroke = 'hsla(0, 0%, 0%, 0.5)';
				playerpos.strokeWidth = 1;
				playerpos.radiusshort = 2.5;
				playerpos.radiuslong = 4;
				playerpos.setPosition(SCREEN_WIDTH - 100, SCREEN_HEIGHT - 100);
				playerpos.rotation = 180;

				for(var i = 0; i < 4; i++) {
					direction[i] = fly.DirectionShape().addChildTo(this);
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

				speed = phina.display.Label({text: 'speed: 1', fontSize: 16, fill: 'hsla(0, 0%, 0%, 0.6)'}).addChildTo(this);
				speed.setPosition(SCREEN_CENTER_X, SCREEN_HEIGHT - 20);
				resolve();
			}, function(resolve) { // Managers Setup
				enemyManager = fly.EnemyManager(this, layer.scene, gauge_boss_h).addChildTo(this);
				effectManager = enemyManager.effectmanager;
				enmBulletManager = fly.BulletManager(layer.scene).addChildTo(this);
				windManager = fly.WindManager(layer.scene).addChildTo(this);
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
					speeds: [0.1, 0.25, 0.45, 0.95], myrot: {x: 0, y: 0, z1: 0, z2: 0},
					row: 0, yo: 0, v: 0, rgc: 0, brc: 0, sc: 0, e: 1000, hp: 1000, speed: 0, ups: 0.00015,
					av: new THREE.Vector3(),
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
							if (fly.colCup2D3(p1, p2, v1, v2, 15 + enmBulletManager.get(i).size)) {
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
							if (fly.colCup2D3(p1, p2, v1, v2, 15 + enemyManager.get(i).size * 3)) {
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
							}, {random: {x: 5, y: 5, z: 5}});
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
