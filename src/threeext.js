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
