phina.define('fly.MainScene', {
	superClass: 'fly.SceneLoadingScene',

	frame: 0, stage: 'arcade',
	difficulty: 1, progress: 0,
	score: 0, goaled: false,

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
		var popup = fly.Popup({label: {text: '', fontSize: 23, fill: 'hsla(0, 0%, 0%, 0.8)'}});

		var enemyManager = fly.EnemyManager(this, layer.scene, gauge_boss_h, message);
		var effectManager = enemyManager.effectmanager;
		var enmBulletManager = fly.BulletManager(layer.scene);
		enemyManager.enmBulletManager = enmBulletManager;
		var windManager = fly.WindManager(layer.scene);

		var flyer = phina.asset.AssetManager.get('threejson', 'fighter').get();
		var goal;
		var sky = phina.asset.AssetManager.get('threecubetex', 'skybox').get();
		var plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), new THREE.MeshBasicMaterial({map: phina.asset.AssetManager.get('threetexture', 'plane').get()}));
		this.load([[
			function(resolve) { // Load Player
				flyer.position.y = 1000;
				flyer.transparent = true;
				flyer.opacity = 0.3;
				flyer.tweener.setUpdateType('fps');
				flyer.$safe({ // Player control
					speeds: [0.1, 0.25, 0.45, 0.95], myrot: {x: 0, y: 0, z1: 0, z2: 0},
					row: 0, yo: 0, v: 0, s1c: 0, s2c: 0, e: 1000, hp: 1000, speed: 0, ups: 0.00015,
					av: new THREE.Vector3(), sub1id: 0, sub2id: 1, auto: 1,
					update: function(p, k, s) {
						this.v += 0.05;
						var c = (p.x - SCREEN_CENTER_X) * (1 - this.auto)
						 - (s.goaled ? -10 : Math.max(Math.min((Math.atan2(goal.position.x - this.position.x, goal.position.z - this.position.z) - this.myrot.y) * 100, 100), -100) * this.auto);
						this.myrot.z1 += c * 0.00008;
						this.yo += c * 0.00008;
						var ty = s.goaled ? 1000 : goal.position.y;
						this.row += ((p.y - SCREEN_CENTER_Y) * (1 - this.auto)
						 	- Math.max(Math.min((Math.atan2(
							ty - this.position.y, phina.geom.Vector2(goal.position.x - this.position.x, goal.position.z - this.position.z).length()
						) + this.myrot.x) * 100, 100), -100) * this.auto) * this.ups;
						if (p.getPointing()) {
							this.e--;
							this.v += this.speeds[this.speed];
						}
						if (k.getKeyDown(68)) { // D Key
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
						this.v *= 0.98 - Math.abs(c) * 0.00006 - (k.getKey(86) ? 0.05 : 0); // V Key

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
				flyer.tweener.to({auto: 0}, 100);
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
						popup.label.text = stage.name;
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
											this.off('enterframe', callfunc);
										}
									}.bind(this);
									this.on('enterframe', callfunc);
								}).bind(this)();
							}
						}
						var material = new THREE.ShaderMaterial({
							transparent: true,
							uniforms: {
								tex1: {type: "t", value: phina.asset.AssetManager.get('threetexture', 'goal').get()},
								tex2: {type: "t", value: phina.asset.AssetManager.get('threetexture', 'goal_disable').get()},
								tex1_percentage: {type: "f", value: 0.0}, time: {type: "f", value: 100 * Math.random()}, alpha: {type: "f", value: 1.0}
							},
							vertexShader: phina.asset.AssetManager.get('text', 'goalvertexshader').get(),
							fragmentShader: phina.asset.AssetManager.get('text', 'goalfragshader').get()
						});
						goal = new THREE.Mesh(new THREE.IcosahedronGeometry(stage.goal.size, 2), material).$safe({
							update: function() {material.uniforms.time.value += 0.005 * Math.random();}
						});
						goal.move(new THREE.Vector3(stage.goal.x, stage.goal.y, stage.goal.z));
						goal.size = stage.goal.size;
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

				var grad = popup.canvas.context.createLinearGradient(0, -popup.height / 2, 0, popup.height / 2);
				grad.addColorStop(0, 'hsla(0, 0%, 0%, 0.6)');
				grad.addColorStop(0.5, 'hsla(0, 0%, 0%, 0)');
				grad.addColorStop(1, 'hsla(0, 0%, 0%, 0.6)');
				popup.fill = grad;

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
					popup.addChildTo(this).setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);
					popup.tweener2 = phina.accessory.Tweener().attachTo(popup);
					popup.tweener.setUpdateType('fps');
					popup.tweener2.setUpdateType('fps');
					popup.tweener.set({width: 0, height: 96}).wait(10).to({width: 1024, height: 4}, 100, 'easeOutInCubic');
					popup.tweener2.set({alpha: 0}).wait(10).to({alpha: 1}, 30).wait(40).to({alpha: 0}, 30);
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
					flyer.flare('enterframe');
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

					var v1 = Axis.z.clone().applyQuaternion(flyer.quaternion).setLength(54);
					var p1 = flyer.position.clone().sub(v1.clone().multiplyScalar(-0.5));
					if (flyer.hp <= 0) {
						if (this.stage === 'arcade') {
							this.exit('gameover', {score: this.score});
						} else {
							this.exit('gameover', {score: this.score});
						}
					} else if ((!this.goaled) && fly.colCup2D3(p1, goal.position.clone(), v1, new THREE.Vector3(0, 0, 0), 15 + goal.size / 2)) {
						flyer.tweener.to({auto: 1}, 60).play();
						this.goaled = true;
					}

					this.frame++;
				}.bind(this);
				resolve();
			}
		]]);
	}
});
