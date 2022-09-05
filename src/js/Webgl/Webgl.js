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

        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableRotate = false;
        this.controls.enableZoom = false;
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN
        };
        this.controls.touches = {
            ONE: THREE.TOUCH.PAN
        };

        this.clock = new THREE.Clock();

        this.physics();

        this.floor();
        this.object();

        this.resize();
        this.setupResize();
        this.render();
    }

    physics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.allowSleep = true;
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);

        this.physicsArray = [];

        this.defaultMaterial = new CANNON.Material('default');

        const defaultContactMaterial = new CANNON.ContactMaterial(
            this.defaultMaterial,
            this.defaultMaterial,
            {
                friction: 0.1,
                restitution: 0.7,
            },
        );
        this.world.addContactMaterial(defaultContactMaterial);
        this.world.defaultContactMaterial = defaultContactMaterial;
    }

    floor() {
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 1, 1),
            new THREE.MeshBasicMaterial({ color: 'red', side: THREE.DoubleSide })
        );

        this.scene.add(floor);

        floor.rotateX(-Math.PI / 2);

        const floorBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane()
        });

        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(floorBody);
    }

    object() {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1, 1, 1, 1),
            new THREE.MeshBasicMaterial({ color: 'green' })
        );
        box.position.y = 0.6;

        this.scene.add(box);

        const boxBody = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
            material: this.defaultMaterial
        });
        boxBody.position.copy(box.position);

        this.world.addBody(boxBody);

        this.physicsArray.push({
            mesh: box,
            body: boxBody
        });
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
        this.controls.update();

        const delta = Math.min(this.clock.getDelta(), 0.1)
        this.world.step(delta)

        this.physicsUpdate();

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this))
    }
}