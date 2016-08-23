phina.define('fly.MainScene', {
	superClass: 'fly.SceneLoadingScene',

	frame: 0, progress: 0, score: 0, goaled: false, bossdefeated: true,

	init: function(options) {
		this.stage = options.stage || 'arcade';
		this.difficulty = options.difficulty || 1;
		this.space = options.space || false;
		this.superInit();
		// Variables
		var layer = phina.glfilter.GLFilterLayer({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});
		var threelayer = phina.display.ThreeLayer({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});
		threelayer.setOrigin(0, 0);

		var map = phina.display.CircleShape({x: SCREEN_WIDTH - 100, y: SCREEN_HEIGHT - 100,
			radius: 75, fill: 'hsla(0, 0%, 30%, 0.5)', stroke: null});
		var playerpos = fly.DirectionShape({
			x: SCREEN_WIDTH - 100, y: SCREEN_HEIGHT - 100, fill: 'hsla(0, 50%, 70%, 0.5)',
			stroke: 'hsla(0, 0%, 0%, 0.5)', strokeWidth: 1, width: 2.5, height: 4});
		var direction = [];

		var gauge_h = phina.ui.Gauge({x: 80, y: SCREEN_HEIGHT - 100, fill: 'rgba(0, 0, 0, 0)',
			gaugeColor: 'rgba(255, 64, 64, 0.3)', value: 1000, maxValue: 1000, strokeWidth: 1, width: 128, height: 16});
		var gauge_e = phina.ui.Gauge({x: 80, y: SCREEN_HEIGHT - 80, fill: 'rgba(0, 0, 0, 0)',
			gaugeColor: 'rgba(64, 64, 255, 0.3)', value: 1000, maxValue: 1000, strokeWidth: 1, width: 128, height: 16});
		var gauge_boss_h = phina.ui.Gauge({x: this.gridX.center(), y: 20, fill: 'rgba(0, 0, 0, 0)',
			gaugeColor: 'rgba(200, 16, 16, 0.3)', strokeWidth: 1, width: SCREEN_WIDTH / 1.2, height: 16});

		var msgbox = phina.display.RectangleShape({y: SCREEN_HEIGHT, fill: 'hsla(0, 0%, 30%, 0.5)', stroke: 'hsla(0, 0%, 30%, 0.25)',
			strokeWidth: 1, cornerRadius: 5, width: SCREEN_WIDTH / 5, height: SCREEN_HEIGHT / 12});
		var message = phina.display.Label({y: SCREEN_HEIGHT, text: '', fontSize: 16, fill: 'hsla(0, 0%, 0%, 0.6)', align: 'left'});
		var speed = phina.display.Label({x: this.gridX.center(), y: SCREEN_HEIGHT - 20, text: 'speed: 1', fontSize: 12, fill: 'hsla(0, 0%, 0%, 0.6)'});
		var mark = fly.MarkShape({x: this.gridX.center(), y: this.gridY.center()});
		var name = fly.Popup({x: this.gridX.center(), y: this.gridY.center(), label: {text: '', fontSize: 23, fill: 'hsla(0, 0%, 0%, 0.8)'}});

		var goals = [];
		var goalraders = [];
		var rates;

		var resultbg = phina.display.RectangleShape({x: this.gridX.center(), width: 360, strokeWidth: 0});
		var resulttitle = phina.display.Label({x: this.gridX.center(), text: 'Result', fontSize: 48, fill: 'hsla(0, 0%, 0%, 0.8)'});
		var resulttext = phina.display.Label({x: this.gridX.center(), text: '', fontSize: 24, fill: 'hsla(0, 0%, 0%, 0.8)'});

		var enemyManager = fly.EnemyManager(this, threelayer.scene, gauge_boss_h, message);
		var effectManager = enemyManager.effectmanager;
		var enmBulletManager = fly.BulletManager(threelayer.scene);
		enemyManager.enmBulletManager = enmBulletManager;
		var obstacleManager = fly.ObstacleManager(threelayer.scene);
		var windManager = fly.WindManager(threelayer.scene);

		var flyer = phina.asset.AssetManager.get('threejson', 'fighter').get();
		var sky = phina.asset.AssetManager.get('threecubetex', 'skybox').get();
		var plane = new THREE.Mesh(new THREE.CircleGeometry(10000, 100), new THREE.MeshBasicMaterial({map: phina.asset.AssetManager.get('threetexture', 'plane').get()}));
		this.load([[
			function(resolve) { // Load Player
				flyer.position.y = 1000;
				flyer.material.opacity = 0.3;
				flyer.tweener.setUpdateType('fps');
				flyer.$safe({ // Player control
					speeds: [0.1, 0.25, 0.45, 0.95], myrot: {x: 0, y: 0, z1: 0, z2: 0},
					row: 0, yo: 0, v: 0, s1c: 0, s2c: 0, e: 2000, hp: 1000, speed: 0, ups: 0.00015,
					av: new THREE.Vector3(), sub1id: 0, sub2id: 1, auto: 1,
					update: function(p, k, s) {
						if (s.stage !== 'arcade' && this.auto !== 0) { // Auto move
							var c = (p.x - SCREEN_CENTER_X) * (1 - this.auto) - (s.goaled ? -10 : Math.max(Math.min((Math.atan2(
								goals.first.position.x - this.position.x, goals.first.position.z - this.position.z) - this.myrot.y) * 100, 100), -100) * this.auto);
							this.myrot.z1 += c * 0.00008;
							this.yo += c * 0.00008;
							var ty = s.goaled ? 50 : 0;
							this.row += ((p.y - SCREEN_CENTER_Y) * (1 - this.auto) - Math.max(Math.min((Math.atan2(
								goals.first.position.y + ty - this.position.y, phina.geom.Vector2(goals.first.position.x - this.position.x, goals.first.position.z - this.position.z).length()
								) + this.myrot.x) * 100, 100), -100) * this.auto) * this.ups;
						} else { // Manual move
							var c = p.x - SCREEN_CENTER_X;
							this.myrot.z1 += c * 0.00008;
							this.yo += c * 0.00008;
							this.row += (p.y - SCREEN_CENTER_Y) * this.ups;
						}
						if (p.getPointing()) { // Speed up
							this.e--;
							if (s.space) {
								this.av.addScaledVector(Axis.z.clone().applyQuaternion(this.quaternion).normalize(), this.speeds[this.speed]);
							} else {
								this.v += this.speeds[this.speed];
							}
						}
						if (k.getKeyDown(68)) { // D Key
							this.speed++;
							this.speed %= this.speeds.length;
							speed.text = 'speed: ' + (this.speed + 1);
						}

						// Move and Rotate
						this.myrot.x += this.row * 0.1;
						this.myrot.y -= this.yo * 0.1;
						this.myrot.x %= Math.PI * 2;
						this.quaternion.copy(new THREE.Quaternion());
						this.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.z, this.myrot.z1 + this.myrot.z2));
						this.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, this.myrot.x));
						this.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, this.myrot.y));
						if (!s.space) {this.position.addScaledVector(Axis.z.clone().applyQuaternion(this.quaternion).normalize(), this.v + 5);}
						this.position.add(this.av);

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
						if (s.space) { // Speed loss
							this.v *= 0.995 - Math.abs(c) * 0.00001 - (k.getKey(86) ? 0.01 : 0); // V Key
							this.av.multiplyScalar(0.995 - (k.getKey(86) ? 0.01 : 0));
						} else {
							this.v *= 0.98 - Math.abs(c) * 0.00006 - (k.getKey(86) ? 0.05 : 0);
							this.av.multiplyScalar(0.98 - (k.getKey(86) ? 0.05 : 0));
						}

						if (this.e > 0) {
							if (k.getKey(90)) { // Z Key
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
								this.beam(35, 2, 15, 0, s);
							}
							if (this.brl > 0) {
								this.brl--;
								this.beam(25, 3, 25, 30, s);
							}
						}
						if (this.s1c > 0) {this.s1c--;}
						if (this.s2c > 0) {this.s2c--;}
						gauge_e.value = this.e;
						if (this.e < 2000) {this.e += 4;}
						gauge_h.value = this.hp;

						for (var i = 0; i < windManager.elements.length; i++) {
							var radius = 15 + windManager.get(i).size;
							var df = Math.sqrt(this.position.x * windManager.get(i).position.x + this.position.z * windManager.get(i).position.y);
							if (df <= radius) {this.av.y += windManager.get(i).v / 2;}
						}
						// hit vs bullet
						for (var i = 0; i < enmBulletManager.elements.length; i++) {
							if (this.position.clone().sub(enmBulletManager.get(i).position).length() < 5 + enmBulletManager.get(i).size) {
								effectManager.explode(enmBulletManager.get(i).position, enmBulletManager.get(i).size, 10);
								this.hp -= enmBulletManager.get(i).atk * s.difficulty;
								s.score--;
								enmBulletManager.removeBullet(i);
							}
						}
						// hit vs enemy
						for (var i = 0; i < enemyManager.elements.length; i++) {
							var v1 = Axis.z.clone().applyQuaternion(this.quaternion).setLength(54);
							var v2 = Axis.z.clone().applyQuaternion(enemyManager.get(i).quaternion).setLength(enemyManager.get(i).size);
							var p1 = this.position.clone().sub(v1.clone().multiplyScalar(-0.5));
							var p2 = enemyManager.get(i).position.clone().sub(v2.clone().multiplyScalar(-0.5));
							if (fly.colCup2D3(p1, p2, v1, v2, 15 + enemyManager.get(i).size * 3)) {
								effectManager.explode(enemyManager.get(i).position, enemyManager.get(i).size, 30);
								this.hp -= enemyManager.get(i).hp * 30 * s.difficulty / (this.v + 1);
								s.score -= 3;
								enemyManager.kill(i);
							}
						}
						// hit vs obstacle
						for (var i = 0; i < obstacleManager.elements.length; i++) {
							if (fly.colobbsphere(obstacleManager.get(i).position, this.position, obstacleManager.get(i).size, obstacleManager.get(i).quaternion, 15)) {this.hp = 0;}
						}
						// hit vs ground
						if (this.position.y <= 0) {this.hp = 0;}
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
							if (this.e >= 1500) {
								this.s2c = 250;
								this.brl = 17;
								this.e -= 1500;
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
				flyer.tweener.to({auto: 0}, 750, 'easeInCubic');
				enemyManager.flyer = flyer;
				resolve();
			}
		], [
			function(resolve) { // Stage loading
				if (this.stage !== 'arcade') {
					var load = function() {
						var stage = phina.asset.AssetManager.get('stage', this.stage).get();
						name.label.text = stage.name;
						for(var i = 0; i < stage.enemys.length; i++) {
							if (!enemyManager.definedenemy[stage.enemys[i].name]) {
								enemyManager.defineEnemy(stage.enemys[i].name);
							}
							enemyManager.createEnemyMulti(stage.enemys[i].name, stage.enemys[i].option, stage.enemys[i].autospawn, stage.enemys[i].killmes);
						}
						for(var i = 0; i < stage.obstacles.length; i++) {
							obstacleManager.createObstacle(stage.obstacles[i].position, stage.obstacles[i].quaternion, stage.obstacles[i].scale);
						}
						for(var i = 0; i < stage.winds.length; i++) {
							windManager.createWind({v: stage.winds[i].v, position: stage.winds[i].position, size: stage.winds[i].size}, stage.winds[i].color);
						}
						for(var i = 0; i < stage.messages.length; i++) {
							if (!stage.messages[i].progress || stage.messages[i].progress < 0.00001) {
								phina.namespace(function() {
									var tmp = i;
									this.on('frame' + (stage.messages[i].time - 5), function() {message.text = '';}.bind(this));
									this.on('frame' + stage.messages[i].time, function() {message.text = stage.messages[tmp].text;}.bind(this));
								}.bind(this));
							} else {
								phina.namespace(function() {
									var tmp = i;
									this.one('enterframe', function() {
										if (stage.messages[tmp].progress < this.progress) {
											this.on('frame' + (this.frame + stage.messages[tmp].time - 5), function() {message.text = '';}.bind(this));
											this.on('frame' + (this.frame + stage.messages[tmp].time), function() {message.text = stage.messages[tmp].text;}.bind(this));
										}
									}.bind(this));
								}.bind(this));
							}
						}
						for(var i = 0; i < stage.goals.length; i++) {
							phina.namespace(function() {
								var material = new THREE.ShaderMaterial({
									transparent: true,
									uniforms: {
										tex1: {type: "t", value: phina.asset.AssetManager.get('threetexture', 'goal').get()},
										tex2: {type: "t", value: phina.asset.AssetManager.get('threetexture', 'goal_disable').get()},
										tex1_percentage: phina.app.Element().$safe({type: "f", value: 0.0}).addChildTo(this), time: {type: "f", value: 100 * Math.random()}, alpha: {type: "f", value: 1.0}
									},
									vertexShader: phina.asset.AssetManager.get('text', 'goalvertexshader').data,
									fragmentShader: phina.asset.AssetManager.get('text', 'goalfragshader').data
								});
								goals[i] = new THREE.Mesh(new THREE.IcosahedronGeometry(stage.goals[i].size, 2), material).$safe({
									size: stage.goals[i].size, kill: stage.goals[i].kill, message: stage.goals[i].message, enable: false,
									update: function(s) {
										material.uniforms.time.value += 0.005 * Math.random();
										if (!this.enable) {
											if (this === goals.first && (this !== goals.last || s.bossdefeated) && enemyManager.killcount >= enemyManager.allcount * this.kill) {
												material.uniforms.tex1_percentage.tweener.to({value: 1}, 50).play();
												goalraders.first.fill = 'hsla(190, 100%, 70%, 0.5)'
												this.enable = true;
											}
										}
									}
								});
								material.uniforms.tex1_percentage.tweener.setUpdateType('fps');
								goals[i].move(new THREE.Vector3(stage.goals[i].x, stage.goals[i].y, stage.goals[i].z));
								var xdist = flyer.position.x / 15 - goals[i].position.x / 15;
								var zdist = flyer.position.z / 15 - goals[i].position.z / 15;
								var distance = Math.min(Math.sqrt(Math.pow(xdist, 2) + Math.pow(zdist, 2)), 75);
								var angle = Math.atan2(xdist, zdist) - flyer.myrot.y + (Math.abs(flyer.myrot.x) > Math.PI / 2 && Math.abs(flyer.myrot.x) < Math.PI * 1.5 ? Math.PI : 0);
								goalraders[i] = phina.display.CircleShape({radius: 5, fill: 'hsla(0, 0%, 70%, 0.5)', stroke: 'hsla(0, 0%, 0%, 0.5)', strokeWidth: 1})
									.setPosition(SCREEN_WIDTH - 100 + Math.sin(angle) * distance, SCREEN_HEIGHT - 100 + Math.cos(angle) * distance);
							}.bind(this));
						}
						this.rate = stage.rate;
						this.space = stage.space;
						resolve();
					}.bind(this);
					if (!phina.asset.AssetManager.get('stage', this.stage)) {
						var loader = phina.asset.AssetLoader();
						var asset = {stage: {}};
						asset.stage[this.stage] = 'data/stages/' + this.stage + '.min.json';
						loader.load(asset).then(function() {
							var stage = phina.asset.AssetManager.get('stage', this.stage).get();
							asset = {threejson: {}};
							if (stage.enemys.length !== 0) {
								for(var i = 0; i < stage.enemys.length; i++) {
									if (!phina.asset.AssetManager.get('threejson', stage.enemys[i].name)) {
										asset.threejson[stage.enemys[i].name] = 'data/models/' + enemyManager.enemys[stage.enemys[i].name].filename + '.min.json';
									}
								}
								loader.onload = load;
								loader.load(asset);
							} else {
								load();
							}
						}.bind(this));
					} else {
						load();
						resolve();
					}
				} else {
					name.label.text = 'Free play';
					var loader = phina.asset.AssetLoader();
					var asset = {threejson: {}};
					enemyManager.enemys.forIn(function(key, value) {
						if (!phina.asset.AssetManager.get('threejson', key)) {
							asset.threejson[key] = 'data/models/' + value.filename + '.min.json';
						}
					});
					loader.load(asset).then(function() {
						enemyManager.enemys.forIn(function(key) {
							if (!enemyManager.definedenemy[key]) {enemyManager.defineEnemy(key);}
						});
					}.bind(this));
					resolve();
				}
			}
		], [
			function(resolve) { // Screen Setup
				layer.addChildTo(this);
				layer.alphaNode = phina.glfilter.AlphaNode(layer.gl, {
					width: layer.domElement.width, height: layer.domElement.height
				});
				var setalpha = function() {
					layer.alphaNode.setUniform(layer.gl, 'color', [1, 1, 1, 1 - this.frame * 0.025]);
					if (this.frame === 40) {
						layer.headNode.connectTo(layer.destNode);
						this.off('enterframe', setalpha);
					}
				}.bind(this);
				this.on('enterframe', setalpha);
				layer.headNode
					.connectTo(layer.alphaNode)
					.connectTo(layer.destNode);
				threelayer.addChildTo(layer);
				map.addChildTo(layer);
				playerpos.addChildTo(layer);
				playerpos.rotation = 180;

				var grad = name.canvas.context.createLinearGradient(0, -name.height / 2, 0, name.height / 2);
				grad.addColorStop(0, 'hsla(0, 0%, 0%, 0.6)');
				grad.addColorStop(0.5, 'hsla(0, 0%, 0%, 0)');
				grad.addColorStop(1, 'hsla(0, 0%, 0%, 0.6)');
				name.fill = grad;
				name.addChildTo(layer);
				name.tweener2 = phina.accessory.Tweener().attachTo(name);
				name.tweener.setUpdateType('fps');
				name.tweener2.setUpdateType('fps');
				name.tweener.set({width: 0, height: 72}).wait(10).to({width: 720, height: 3}, 100, 'easeOutInCubic');
				name.tweener2.set({alpha: 0}).wait(10).fadeIn(30).wait(40).fadeOut(30);

				for(var i = 0; i < 4; i++) {
					direction[i] = fly.DirectionShape({
						x: SCREEN_WIDTH - 100 - 75 * Math.sin(i * Math.PI / 2), y: SCREEN_HEIGHT - 100 - 75 * Math.cos(i * Math.PI / 2),
						fill: 'hsla(0, {0}%, {1}%, 0.5)'.format(i === 0 ? 40 : 0, (i === 0 ? 10 : 0) + 10), stroke: null, width: 12, height: 7.5
					}).addChildTo(layer);
					direction[i].rotation = -i * 90;
				}
				mark.addChildTo(this);

				gauge_h.addChildTo(layer);
				gauge_h.animation = false;
				gauge_e.addChildTo(layer);
				gauge_e.animation = false;
				if (this.stage !== 'arcade') {
					for(var i = 0; i < goalraders.length; i++) {goalraders[i].addChildTo(layer)};
					gauge_boss_h.addChildTo(layer);
					gauge_boss_h.tweener.setUpdateType('fps');
					gauge_boss_h.alpha = 0;
					gauge_boss_h.animation = false;
					msgbox.addChildTo(layer);
					msgbox.live = 0;
					message.addChildTo(layer);
					grad = resultbg.canvas.context.createLinearGradient(0, -SCREEN_CENTER_Y, 0, SCREEN_CENTER_Y);
					grad.addColorStop(0, 'hsla(0, 0%, 0%, 0.6)');
					grad.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
				}
				resultbg.fill = grad;
				resultbg.addChildTo(layer);
				resulttitle.addChildTo(layer);
				resulttext.addChildTo(layer);
				resultbg.tweener.setUpdateType('fps');
				resulttitle.tweener.setUpdateType('fps');
				resulttext.tweener.setUpdateType('fps');
				resultbg.alpha = 0;
				resulttitle.alpha = 0;
				resulttext.alpha = 0;
				speed.addChildTo(layer);

				enemyManager.addChildTo(this);
				enmBulletManager.addChildTo(this);
				windManager.addChildTo(this);
				resolve();
			}, function(resolve) { // Stage Setup
				var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
				directionalLight.position.set(0, 0, 30);
				sky.update = function() {this.move(flyer.position);};
				plane.update = function() {
					this.position.x = flyer.position.x;
					this.position.z = flyer.position.z;
				};
				plane.rotate(-Math.PI / 2, 0, 0);
				if (this.stage !== 'arcade') {
					for(var i = 0; i < goals.length; i++) {
						goals[i].tweener.setUpdateType('fps');
						threelayer.scene.add(goals[i]);
					}
				}
				threelayer.scene.add(directionalLight);
				threelayer.scene.add(new THREE.AmbientLight(0x606060));
				threelayer.scene.add(flyer);
				threelayer.scene.add(sky);
				threelayer.scene.add(plane);
				threelayer.camera.radiuses = [-100, 10, 28];
				threelayer.camera.radius = 0;
				resolve();
			}, function(resolve) {
				threelayer.update = function(app) { // Update routine
					var p = app.pointer;
					var k = app.keyboard;
					if (!flyer) {
						threelayer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, -0.002));
					} else if (this.goaled) {
						flyer.flare('enterframe');
						flyer.update(p, k, this);
						sky.update();
						plane.update();
						// Camera control
						threelayer.camera.quaternion.copy(new THREE.Quaternion());
						threelayer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.z, -flyer.myrot.z2 + (threelayer.camera.radius !== 0 ? -flyer.myrot.z1 : 0)));
						threelayer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, -flyer.myrot.x));
						threelayer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, flyer.myrot.y + Math.PI));
						var vec = Axis.z.clone().applyQuaternion(threelayer.camera.quaternion).negate().setLength(threelayer.camera.radiuses[threelayer.camera.radius]);
						threelayer.camera.position.copy(flyer.position.clone().add(vec));
					} else {
						if (this.stage === 'arcade') { // Arcade mode (random enemy spawn)
							var rand = Math.random();
							if (rand > 0.98 && enemyManager.count() < 100) {
								if (rand < 0.995) {
									var enmname = 'enem1';
								}	else if (rand < 0.9975) {
									var enmname = 'enem2';
								} else {
									var enmname = 'enem3';
								}
								enemyManager.createEnemyMulti(enmname, {
									position: new THREE.Vector3(Math.randint(-500, 500), Math.randint(500, 1500), Math.randint(-500, 500)).add(flyer.position),
									quaternion: new THREE.Quaternion().rotate(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2)
								}, {random: {x: 50, y: 50, z: 50}});
							}
							this.difficulty += 0.0001;
							if (enemyManager.count() > 50) {enemyManager.removeEnemy(0);}
						} else {
							for(var i = 0; i < goals.length; i++) {
								var xdist = flyer.position.x / 15 - goals[i].position.x / 15;
								var zdist = flyer.position.z / 15 - goals[i].position.z / 15;
								var distance = Math.min(Math.sqrt(Math.pow(xdist, 2) + Math.pow(zdist, 2)), 75);
								var angle = Math.atan2(xdist, zdist) - flyer.myrot.y + (Math.abs(flyer.myrot.x) > Math.PI / 2 && Math.abs(flyer.myrot.x) < Math.PI * 1.5 ? Math.PI : 0);
								goalraders[i].setPosition(SCREEN_WIDTH - 100 + Math.sin(angle) * distance, SCREEN_HEIGHT - 100 + Math.cos(angle) * distance);
								goals[i].update(this);
							}
							this.progress = flyer.position.clone().dot(goals.last.position) / goals.last.position.clone().dot(goals.last.position);
							enemyManager.flare('frame', {progress: this.progress});
						}
						for (var i = 0; i < enmBulletManager.elements.length; i++) {
							if (enmBulletManager.get(i).position.clone().sub(flyer.position).length > 800) {
								enmBulletManager.removeBullet(i);
							}
						}
						if (enmBulletManager.count() > 1000) {for(var i = 0; enmBulletManager.count() > 500; i++) {enmBulletManager.removeBullet(0);}}

						this.flare('frame' + this.frame);
						enemyManager.flare('frame' + this.frame);
						flyer.flare('enterframe');
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
						if (k.getKeyDown(53)) { // 5 Key
							threelayer.camera.radius++;
							threelayer.camera.radius %= threelayer.camera.radiuses.length;
						}
						threelayer.camera.quaternion.copy(new THREE.Quaternion());
						threelayer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.z, -flyer.myrot.z2 + (threelayer.camera.radius !== 0 ? -flyer.myrot.z1 : 0)));
						threelayer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, -flyer.myrot.x));
						threelayer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, flyer.myrot.y + Math.PI));
						var vec = Axis.z.clone().applyQuaternion(threelayer.camera.quaternion).negate().setLength(threelayer.camera.radiuses[threelayer.camera.radius]);
						threelayer.camera.position.copy(flyer.position.clone().add(vec));

						if (this.bosscoming) {
							if (this.boss.parent === null) {
								this.bosscoming = false;
								gauge_boss_h.tweener.fadeOut(10).play();
								this.bossdefeated = true;
							} else {
								gauge_boss_h.value = this.boss.hp;
							}
						}

						if (k.getKeyDown(32)) {message.text = '';} // Space Key

						var v1 = Axis.z.clone().applyQuaternion(flyer.quaternion).setLength(54);
						var p1 = flyer.position.clone().sub(v1.clone().multiplyScalar(-0.5));
						if (flyer.hp <= 0) {
							enemyManager.effectmanager.explode(flyer.position, 10, 30);
							threelayer.scene.remove(flyer);
							flyer = null;
							resultbg.tweener.to({alpha: 1, height: SCREEN_HEIGHT, y: SCREEN_CENTER_Y}, 5).play();
							resulttitle.tweener.to({alpha: 1, y: SCREEN_CENTER_Y / 3}, 3).play();
							resulttext.tweener.wait(10).to({alpha: 1, y: SCREEN_CENTER_Y * 0.6}, 3).play();
							if (this.score < 0) {this.score = 0;}
							resulttext.text = 'Score: ' + this.score.toFixed(0)
								+ '\nKill: ' + enemyManager.killcount + '(' + (enemyManager.killcount / enemyManager.allcount * 100).toFixed(1) + '%)'
							resulttitle.text = 'Game Over';
							message.text = '';
							map.tweener.fadeOut(20).play();
							if (this.stage !== 'arcade') {
								for (var i = 0; i < goalraders.length; i++) {goalraders[i].tweener.fadeOut(20).play();}
							}
							for (var i = 0; i < enemyManager.count(); i++) {enemyManager.enemyraders[i].tweener.fadeOut(20).play();}
							for(var i = 0; i < 4; i++) {direction[i].tweener.fadeOut(20).play();}
							playerpos.tweener.fadeOut(20).play();
							gauge_h.tweener.fadeOut(20).play();
							gauge_e.tweener.fadeOut(20).play();
							msgbox.tweener.fadeOut(20).play();
							speed.tweener.fadeOut(20).play();
							mark.tweener.fadeOut(20).play();
						} else if (this.stage !== 'arcade' && goals.first.enable && fly.colCup2D3(p1, goals.first.position.clone(), v1, new THREE.Vector3(0, 0, 0), 15 + goals.first.size / 2)) {
							if (goals.length === 1) {
								flyer.tweener.to({auto: 1}, 60).play();
								resultbg.tweener.to({alpha: 1, height: SCREEN_HEIGHT, y: SCREEN_CENTER_Y}, 5).play();
								resulttitle.tweener.to({alpha: 1, y: SCREEN_CENTER_Y / 3}, 3).play();
								resulttext.tweener.wait(10).to({alpha: 1, y: SCREEN_CENTER_Y * 0.6}, 3).play();
								var rate = '';
								this.score += this.rate[0] * flyer.hp / 1000;
								if (this.score >= this.rate[3]) {
									rate = 'Perfect';
								} else if (this.score >= this.rate[2]) {
									rate = 'Good';
								} else if (this.score >= this.rate[1]) {
									rate = 'Middle';
								} else {
									rate = 'Bad';
								}
								if (this.score < 0) {this.score = 0;}
								resulttext.text = 'Score: ' + this.score.toFixed(0)
									+ '\nKill: ' + enemyManager.killcount + '(' + (enemyManager.killcount / enemyManager.allcount * 100).toFixed(1) + '%)'
									+ '\nLife: ' + (flyer.hp / 10).toFixed(1) + '%'
									+ '\nRate: ' + rate;
								message.text = '';
								map.tweener.fadeOut(20).play();
								for (var i = 0; i < goalraders.length; i++) {goalraders[i].tweener.fadeOut(20).play();}
								for (var i = 0; i < enemyManager.count(); i++) {enemyManager.enemyraders[i].tweener.fadeOut(20).play();}
								for(var i = 0; i < 4; i++) {direction[i].tweener.fadeOut(20).play();}
								playerpos.tweener.fadeOut(20).play();
								gauge_h.tweener.fadeOut(20).play();
								gauge_e.tweener.fadeOut(20).play();
								msgbox.tweener.fadeOut(20).play();
								speed.tweener.fadeOut(20).play();
								mark.tweener.fadeOut(20).play();
								this.goaled = true;
							} else {
								var tmp = goals.first.message;
								this.on('frame' + (this.frame + 30), function() {message.text = tmp;}.bind(this));
								goals.first.parent.remove(goals.first);
								goals.splice(0, 1);
								goalraders.first.remove();
								goalraders.splice(0, 1);
							}
						}

						if (this.frame % 600 === 0) {this.score--;}

						this.frame++;
					}
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
					threelayer.camera.updateMatrixWorld();
				}.bind(this);
				resolve();
			}
		]]);
	}
});
