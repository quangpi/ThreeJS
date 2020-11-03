import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js";

function main() {
    const canvas = document.querySelector("#c");
    const view1Elem = document.querySelector("#view1");
    const view2Elem = document.querySelector("#view2");
    const renderer = new THREE.WebGLRenderer({ canvas });

    const fov = 45;
    const aspect = 2;
    const near = 5;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(10, 5, 10);
    const cameraHelper = new THREE.CameraHelper(camera);

    class MinMaxGUIHelper {
        constructor(obj, minProp, maxProp, minDif) {
            this.obj = obj;
            this.minProp = minProp;

            this.maxProp = maxProp;
            this.minDif = minDif;
        }
        get min() {
            return this.obj[this.minProp];
        }
        set min(v) {
            this.obj[this.minProp] = v;
            this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
        }
        get max() {
            return this.obj[this.maxProp];
        }
        set max(v) {
            this.obj[this.maxProp] = v;
            this.min = this.min;
        }
    }

    const gui = new GUI();
    gui.add(camera, "zoom", 0.01, 1, 0.01).listen();
    const minMaxGUIHelper = new MinMaxGUIHelper(camera, "near", "far", 0.1);
    gui.add(minMaxGUIHelper, "min", 0.1, 50, 0.1).name("near");
    gui.add(minMaxGUIHelper, "max", 0.1, 50, 0.1).name("far");

    const controls = new OrbitControls(camera, view1Elem);
    controls.target.set(0, 5, 0);
    controls.update();

    const camera2 = new THREE.PerspectiveCamera(60, 2, 0.1, 500);
    camera2.position.set(40, 10, 30);
    camera2.lookAt(0, 5, 0);

    const control2 = new OrbitControls(camera2, view2Elem);
    control2.target.set(0, 5, 0);
    control2.update();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("black");
    scene.add(cameraHelper);

    function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
        const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
        const halfFovY = THREE.MathUtils.degToRad(camera.fov * 1.3);
        const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);

        const direction = new THREE.Vector3().subVectors(camera.position, boxCenter).multiply(new THREE.Vector3(1, 0.1, 1)).normalize();

        camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

        camera.near = boxSize / 10;
        camera.far = boxSize * 10;
        camera.updateProjectionMatrix();
        camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
    }

    {
        const skyColor = 0xb1e1ff; // light blue
        const groundColor = 0xb97a20; // brownish orange
        const intensity = 1;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);
    }

    {
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 10, 0);
        light.target.position.set(-5, 0, 0);
        scene.add(light);
        scene.add(light.target);
    }

    let cars;
    {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load("./q/scene.gltf", (gltf) => {
            const root = gltf.scene;

            scene.add(root);
           
            cars = root;

            const box = new THREE.Box3().setFromObject(root);

            const boxSize = box.getSize(new THREE.Vector3()).length();
            const boxCenter = box.getCenter(new THREE.Vector3());

            frameArea(boxSize * 4.5, boxSize, boxCenter, camera);

            controls.maxDistance = boxSize * 13;
            controls.target.copy(boxCenter);
            controls.update();
        });
    }

    let cars2;
    {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load("./q/scene.gltf", (gltf) => {
            const root = gltf.scene;
            scene.add(root);
            
            cars2 = root;

            const box = new THREE.Box3().setFromObject(root);

            const boxSize = box.getSize(new THREE.Vector3()).length();
            const boxCenter = box.getCenter(new THREE.Vector3());

            frameArea(boxSize * 4.5, boxSize, boxCenter, camera);

            controls.maxDistance = boxSize * 13;
            controls.target.copy(boxCenter);
            controls.update();
        });
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function setScissorForElement(elem) {
        const canvasRect = canvas.getBoundingClientRect();
        const elemRect = elem.getBoundingClientRect();

        const right = Math.min(elemRect.right, canvasRect.right) - canvasRect.left;
        const left = Math.max(0, elemRect.left - canvasRect.left);
        const bottom = Math.min(elemRect.bottom, canvasRect.bottom) - canvasRect.top;
        const top = Math.max(0, elemRect.top - canvasRect.top);

        const width = Math.min(canvasRect.width, right - left);
        const height = Math.min(canvasRect.height, bottom - top);

        const positiveYUpBottom = canvasRect.height - bottom;
        renderer.setScissor(left, positiveYUpBottom, width, height);
        renderer.setViewport(left, positiveYUpBottom, width, height);

        return width / height;
    }

    function render(time) {
        time *= 0.001;
        resizeRendererToDisplaySize(renderer);

        if (cars) {
            cars.rotation.y = time;
        }
        renderer.setScissorTest(true);

        {
            const aspect = setScissorForElement(view1Elem);

            camera.left = -aspect;
            camera.right = aspect;
            camera.updateProjectionMatrix();
            cameraHelper.update();

            cameraHelper.visible = false;

            scene.background.set("blue");

            renderer.render(scene, camera);
        }

        {
            const aspect = setScissorForElement(view2Elem);

            camera2.aspect = aspect;
            camera2.updateProjectionMatrix();

            cameraHelper.visible = true;

            scene.background.set("lightblue");

            renderer.render(scene, camera2);
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
