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
