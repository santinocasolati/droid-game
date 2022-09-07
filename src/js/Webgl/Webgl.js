import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as CANNON from 'cannon-es';
// import gsap from 'gsap';

export default class Webgl {
    constructor(options) {
        this.container = options.domElement;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camera.position.set(5, 10, 10);
        this.camera.lookAt(0, 0, 0);

        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.clock = new THREE.Clock();

        this.physics();

        this.floor();
        this.object();

        this.setMovement();

        this.resize();
        this.setupResize();
        this.render();
    }

    physics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();

        this.physicsArray = [];
    }

    floor() {
        this.floor = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 1, 1),
            new THREE.MeshBasicMaterial({ color: 'red', side: THREE.DoubleSide })
        );

        this.scene.add(this.floor);

        this.floor.rotateX(-Math.PI / 2);

        this.floorBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane()
        });

        this.floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(this.floorBody);
    }

    object() {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: 'green' })
        );
        box.position.y = 3;

        this.scene.add(box);

        const boxBody = new CANNON.Body({
            mass: 5,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
            linearDamping: 0.5,
            angularDamping: 1.0,
        });
        boxBody.position.copy(box.position);

        this.world.addBody(boxBody);

        this.player = {
            mesh: box,
            body: boxBody
        }

        this.physicsArray.push({
            mesh: box,
            body: boxBody
        });
    }

    setMovement() {
        this.keysPressed = {
            w: false,
            s: false,
            a: false,
            d: false
        }

        window.addEventListener("keydown", (e) => {
            const key = e.key.toLowerCase();
            switch (key) {
                case 'w':
                    this.keysPressed.w = true;
                    break;

                case 's':
                    this.keysPressed.s = true;
                    break;

                case 'a':
                    this.keysPressed.a = true;
                    break;

                case 'd':
                    this.keysPressed.d = true;
                    break;

                default:
                    break;
            }
        });

        window.addEventListener("keyup", (e) => {
            const key = e.key.toLowerCase();
            switch (key) {
                case 'w':
                    this.keysPressed.w = false;
                    break;

                case 's':
                    this.keysPressed.s = false;
                    break;

                case 'a':
                    this.keysPressed.a = false;
                    break;

                case 'd':
                    this.keysPressed.d = false;
                    break;

                default:
                    break;
            }
        });

        window.addEventListener("keypress", (e) => {
            const key = e.code.toLowerCase();

            if (key === 'space') {
                this.jump();
            }
        });

        this.player.body.addEventListener("collide", (e) => {
            if (e.body === this.floorBody) {
                this.canJump = true;
            }
        })

        this.axisY = new CANNON.Vec3(0, 1, 0);
        this.rotationQuaternion = new CANNON.Quaternion();
        this.localVelocity = new CANNON.Vec3();
        this.moveDistance = 35;
        this.jumpVelocity = 8;
        this.canJump = false;
    }

    moveSystem(delta) {
        let rotateAngle = (Math.PI / 2) * delta;

        if (this.keysPressed.a) {
            this.rotationQuaternion.setFromAxisAngle(this.axisY, rotateAngle);
            this.player.body.quaternion = this.rotationQuaternion.mult(this.player.body.quaternion);
        }

        if (this.keysPressed.d) {
            this.rotationQuaternion.setFromAxisAngle(this.axisY, -rotateAngle);
            this.player.body.quaternion = this.rotationQuaternion.mult(this.player.body.quaternion);
        }

        this.localVelocity.set(0, 0, this.moveDistance * 0.2);
        const worldVelocity = this.player.body.quaternion.vmult(this.localVelocity);

        if (this.keysPressed.w) {
            this.player.body.velocity.x = -worldVelocity.x;
            this.player.body.velocity.z = -worldVelocity.z;
        }

        if (this.keysPressed.s) {
            this.player.body.velocity.x = worldVelocity.x;
            this.player.body.velocity.z = worldVelocity.z;
        }

        this.camera.position.x = this.player.mesh.position.x + 5;
        this.camera.position.z = this.player.mesh.position.z + 10;
    }

    jump() {
        if (this.canJump) {
            this.canJump = false;
            this.player.body.velocity.y = this.jumpVelocity;
        }
    }

    resize() {
        setTimeout(() => {
            this.width = this.container.offsetWidth;
            this.height = this.container.offsetHeight;

            this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);

            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
        }, 100);
    }

    setupResize() {
        window.addEventListener('resize', this.resize.bind(this));
    }

    physicsUpdate() {
        for (const object of this.physicsArray) {
            object.mesh.position.copy(object.body.position);
            object.mesh.quaternion.copy(object.body.quaternion);
        }
    }

    render() {
        // this.controls.update();

        const delta = this.clock.getDelta();
        this.world.step(1 / 60);

        this.moveSystem(delta);
        this.physicsUpdate();

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this))
    }
}