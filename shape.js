/* Intersection structure:
 * t:        ray parameter (float), i.e. distance of intersection point to ray's origin
 * position: position (THREE.Vector3) of intersection point
 * normal:   normal (THREE.Vector3) of intersection point
 * material: material of the intersection object
 */
class Intersection {
	constructor() {
		this.t = 0;
		this.position = new THREE.Vector3();
		this.normal = new THREE.Vector3();
		this.material = null;
	}
	set(isect) {
		this.t = isect.t;
		this.position = isect.position;
		this.normal = isect.normal;
		this.material = isect.material;
	}
}

/* Plane shape
 * P0: a point (THREE.Vector3) that the plane passes through
 * n:  plane's normal (THREE.Vector3)
 */
class Plane {
	constructor(P0, n, material) {
		this.P0 = P0.clone();
		this.n = n.clone();
		this.n.normalize();
		this.material = material;
	}
	// Given ray and range [tmin,tmax], return intersection point.
	// Return null if no intersection.
	intersect(ray, tmin, tmax) {
		let temp = this.P0.clone();
		temp.sub(ray.o); // (P0-O)
		let denom = ray.d.dot(this.n); // d.n
		if (denom == 0) { 
			return null;	
		}
		let t = temp.dot(this.n) / denom; // (P0-O).n / d.n
		if (t < tmin || t > tmax) {
			return null; // check range
		}
		let isect = new Intersection();   // create intersection structure
		isect.t = t;
		isect.position = ray.pointAt(t);
		isect.normal = this.n;
		isect.material = this.material;
		return isect;
	}
}

/* Sphere shape
 * C: center of sphere (type THREE.Vector3)
 * r: radius
 */
class Sphere {
	constructor(C, r, material) {
		this.C = C.clone();
		this.r = r;
		this.r2 = r*r;
		this.material = material;
	}
	intersect(ray, tmin, tmax) {
		// ===YOUR CODE STARTS HERE===
		let O = ray.o.clone();
		let A = 1;
		let B = O.sub(this.C).multiplyScalar(2).dot(ray.d); // 2(O - C) . d
		O = ray.o.clone();
		let C = O.sub(this.C).lengthSq() - this.r2;
		let delta = B*B - 4*A*C;
		if (delta < 0) {
			return null;
		}
		let t1 = (-B - Math.sqrt(delta)) / (2 * A); // t1 <= t2
		let t2 = (-B + Math.sqrt(delta)) / (2 * A); // t2 >= t1
		let t;
		if (tmin < t1 && t1 < tmax) {
			t = t1;
		}
		else if (tmin < t2 && t2 < tmax) {
			t = t2;
		}
		else {
			return null;
		}
		let isect = new Intersection();
		isect.t = t;
		isect.position = ray.pointAt(t);
		isect.normal = ray.pointAt(t).sub(this.C).normalize();
		isect.material = this.material;
		return isect;
		// ---YOUR CODE ENDS HERE---
	}
}

class Triangle {
	/* P0, P1, P2: three vertices (type THREE.Vector3) that define the triangle
	 * n0, n1, n2: normal (type THREE.Vector3) of each vertex */
	constructor(P0, P1, P2, material, n0, n1, n2) {
		this.P0 = P0.clone();
		this.P1 = P1.clone();
		this.P2 = P2.clone();
		this.material = material;
		if(n0) this.n0 = n0.clone();
		if(n1) this.n1 = n1.clone();
		if(n2) this.n2 = n2.clone();

		// below you may pre-compute any variables that are needed for intersect function
		// such as the triangle normal etc.
		// ===YOUR CODE STARTS HERE===

		// ---YOUR CODE ENDS HERE---
	} 

	intersect(ray, tmin, tmax) {
		// ===YOUR CODE STARTS HERE===
		let P2_P0 = this.P2.clone().sub(this.P0);
		let P2_P1 = this.P2.clone().sub(this.P1);
		let m1 = new THREE.Matrix3();
		m1.set(ray.d.x, ray.d.y, ray.d.z,
			   P2_P0.x, P2_P0.y, P2_P0.z,
			   P2_P1.x, P2_P1.y, P2_P1.z);
		m1.getInverse(m1);
		let P2_O = this.P2.clone().sub(ray.o);
		// cant find a method thatll do matrix vector multiplication correctly...
		// decided to do it on my own
		let tAB = new THREE.Vector3((m1.elements[0] * P2_O.x) + (m1.elements[1] * P2_O.y) + (m1.elements[2] * P2_O.z),
			                        (m1.elements[3] * P2_O.x) + (m1.elements[4] * P2_O.y) + (m1.elements[5] * P2_O.z),
								    (m1.elements[6] * P2_O.x) + (m1.elements[7] * P2_O.y) + (m1.elements[8] * P2_O.z));
		let t = tAB.x;
		let alpha = tAB.y;
		let beta = tAB.z;
		let gamma = 1 - alpha - beta;
		if (t < tmin || t > tmax || t < 0 || alpha < 0 || beta < 0 || (alpha + beta) > 1) {
			return null;
		}
		let isect = new Intersection();
		isect.t = t;
		isect.position = ray.pointAt(t);
		if (this.n0 != null && this.n1 != null && this.n2 != null) {
			let an0 = this.n0.clone().multiplyScalar(alpha);
			let bn1 = this.n1.clone().multiplyScalar(beta);
			let rn2 = this.n2.clone().multiplyScalar(gamma);
			isect.normal = an0.add(bn1).add(rn2).normalize();
		}
		else {
			isect.normal = P2_P0.cross(P2_P1).normalize();
		}	
		isect.material = this.material;
		return isect;
		// ---YOUR CODE ENDS HERE---
	}
}

function shapeLoadOBJ(objstring, material, smoothnormal) {
	loadOBJFromString(objstring, function(mesh) { // callback function for non-blocking load
		if(smoothnormal) mesh.computeVertexNormals();
		for(let i=0;i<mesh.faces.length;i++) {
			let p0 = mesh.vertices[mesh.faces[i].a];
			let p1 = mesh.vertices[mesh.faces[i].b];
			let p2 = mesh.vertices[mesh.faces[i].c];
			if(smoothnormal) {
				let n0 = mesh.faces[i].vertexNormals[0];
				let n1 = mesh.faces[i].vertexNormals[1];
				let n2 = mesh.faces[i].vertexNormals[2];
				shapes.push(new Triangle(p0, p1, p2, material, n0, n1, n2));
			} else {
				shapes.push(new Triangle(p0, p1, p2, material));
			}
		}
	}, function() {}, function() {});
}

/* ========================================
 * You can define additional Shape classes,
 * as long as each implements intersect function.
 * ======================================== */
