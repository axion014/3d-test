phina.define('fly.ObstacleManager', {
	superClass: 'fly.SimpleUpdater',

	init: function(ts) {
		this.superInit();
		this.threescene = ts;
	},

	createObstacle: function(p, q, s) {
		var obstacle = THREE.$extend(new THREE.Mesh(new THREE.BoxGeometry(s.x, s.y, s.z), new THREE.MeshBasicMaterial({
			color: c, side: THREE.DoubleSide
		})), {position: p, quaternion: q, scale: s});
		this.threescene.add(obstacle);
		this.elements.push(obstacle);
		return obstacle;
	},

	update: function() {
	},

	removeObstacle: function(i) {
		this.get(i).parent.remove(this.get(i));
		this.elements.splice(i, 1);
	}
});
