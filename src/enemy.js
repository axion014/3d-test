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

	defineEnemy: function(n, r, as) {
		this.definedenemy[n] = {mesh: phina.asset.AssetManager.get('threejson', n).get(), routine: r.$safe({
			hp: 5, size: 1, v: 0, c: new THREE.Quaternion(), time: 0, update: function(){}
		}), autospawn: (as || {}).$safe({rep: 1, options: {}})};
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
			this.get(i).update();
			var xdist = this.flyer.position.x / 10 - this.get(i).position.x / 10;
			var zdist = this.flyer.position.z / 10 - this.get(i).position.z / 10;
			var distance = Math.sqrt(Math.pow(xdist, 2) + Math.pow(zdist, 2));
			var angle = Math.atan2(xdist, zdist) - this.flyer.myrot.y + (Math.abs(this.flyer.myrot.x) > Math.PI / 2 && Math.abs(this.flyer.myrot.x) < Math.PI * 1.5 ? Math.PI : 0);
			distance = Math.min(distance, 75);
			this.enemyraders[i].setPosition(SCREEN_WIDTH - 100 + Math.sin(angle) * distance,
				SCREEN_HEIGHT - 100 + Math.cos(angle) * distance);
			if (this.get(i).hp <= 0) {
				this.remove(i);
				i--;
			}
		}
	},

	remove: function(i) {
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
	}
});
