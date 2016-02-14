phina.define('nfc.EnemyManager', {
	superClass: 'nfc.SimpleUpdater',

	definedenemy: [],
	enemyraders: [],

	init: function(s, ts) {
		this.superInit();
		this.scene = s;
		this.threescene = ts;
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
