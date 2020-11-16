import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r122/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/controls/OrbitControls.js";
import { OBJLoader2 } from "https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/loaders/OBJLoader2.js";
import { MTLLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/loaders/MTLLoader.js";
import { MtlObjBridge } from "https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js";
import { GLTFLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js";

function main() {
    const canvas = document.querySelector("#c");
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.shadowMap.enabled = true;
    const gui = new GUI();
    const fov = 45;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("black");

    const cameraPole = new THREE.Object3D();
    scene.add(cameraPole);
    cameraPole.add(camera);

    //Add image to one side of cube
    {
        const cubeSize = 40;
        const loader = new THREE.TextureLoader();
        const texture = loader.load("https://threejsfundamentals.org/threejs/resources/images/checker.png");
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = cubeSize / 10;
        texture.repeat.set(repeats, repeats);

        const cubeGeo = new THREE.BoxBufferGeometry(cubeSize, cubeSize, cubeSize, cubeSize);
        const cubeMat = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.BackSide,
        });
        const mesh = new THREE.Mesh(cubeGeo, cubeMat);
        mesh.receiveShadow = true;
        mesh.rotation.y = Math.PI * -0.5;
        mesh.position.set(0, cubeSize / 2 - 1.5, -4);
        scene.add(mesh);
    }

    //. Look to Select with GLTF model
    class PickHelper {
        constructor() {
            this.raycaster = new THREE.Raycaster();
            this.pickedObject = null;
            this.pickedObjectSavedMaterial = null;
            this.selectMaterial = new THREE.MeshBasicMaterial();
            this.infoElem = document.querySelector("#info");
        }
        pick(normalizedPosition, scene, camera, time) {
            if (this.pickedObject) {
                this.pickedObject.material = this.pickedObjectSavedMaterial;
                this.pickedObject = undefined;
                this.infoElem.textContent = "";
            }

            this.raycaster.setFromCamera(normalizedPosition, camera);

            const intersectedObjects = this.raycaster.intersectObjects(pickableMeshes);
            if (intersectedObjects.length) {
                this.pickedObject = intersectedObjects[0].object;
                this.pickedObjectSavedMaterial = this.pickedObject.material;
                this.pickedObject.material = this.selectMaterial;
                this.selectMaterial.color.setHex((time * 8) % 2 > 1 ? 0xffff00 : 0xff0000);
                this.infoElem.textContent = this.pickedObject.name;
            }
        }
    }

    const pickPosition = { x: 0, y: 0 };
    const pickHelper = new PickHelper();
    clearPickPosition();

    {
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        camera.add(light);
    }

    class ColorGUIHelper {
        constructor(object, prop) {
            this.object = object;
            this.prop = prop;
        }
        get value() {
            return `#${this.object[this.prop].getHexString()}`;
        }
        set value(hexString) {
            this.object[this.prop].set(hexString);
        }
    }

    function makeXYZGUI(gui, vector3, name, onChangeFn) {
        const folder = gui.addFolder(name);
        folder.add(vector3, "x", -10, 10).onChange(onChangeFn);
        folder.add(vector3, "y", 0, 10).onChange(onChangeFn);
        folder.add(vector3, "z", -10, 10).onChange(onChangeFn);
    }

    {
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.PointLight(color, intensity);
        light.castShadow = true;
        light.position.set(0, 10, 0);
        scene.add(light);

        const helper = new THREE.PointLightHelper(light);
        scene.add(helper);

        function updateCamera() {}

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

        class FogGUIHelper {
            constructor(fog, backgroundColor) {
                this.fog = fog;
                this.backgroundColor = backgroundColor;
            }
            get near() {
                return this.fog.near;
            }
            set near(v) {
                this.fog.near = v;
                this.fog.far = Math.max(this.fog.far, v);
            }
            get far() {
                return this.fog.far;
            }
            set far(v) {
                this.fog.far = v;
                this.fog.near = Math.min(this.fog.near, v);
            }
            get color() {
                return `#${this.fog.color.getHexString()}`;
            }
            set color(hexString) {
                this.fog.color.set(hexString);
                this.backgroundColor.set(hexString);
            }
        }

        //Gắn intensity, distance
        gui.addColor(new ColorGUIHelper(light, "color"), "value").name("color");
        gui.add(light, "intensity", 0, 2, 0.01);
        gui.add(light, "distance", 0, 40).onChange(updateCamera);

        //Gắn Shadow Camera
        {
            const folder = gui.addFolder("Shadow Camera");
            folder.open();
            const minMaxGUIHelper = new MinMaxGUIHelper(light.shadow.camera, "near", "far", 0.1);
            folder.add(minMaxGUIHelper, "min", 0.1, 50, 0.1).name("near").onChange(updateCamera);
            folder.add(minMaxGUIHelper, "max", 0.1, 50, 0.1).name("far").onChange(updateCamera);
        }

        makeXYZGUI(gui, light.position, "Position", updateCamera);

        //Gắn Fog
        {
            const folder = gui.addFolder("Fog");
            folder.open();
            const near = 1;
            const far = 51;
            const color = "lightblue";
            scene.fog = new THREE.Fog(color, near, far);
            scene.background = new THREE.Color(color);

            const fogGUIHelper = new FogGUIHelper(scene.fog, scene.background);
            gui.add(fogGUIHelper, "near", near, far).listen();
            gui.add(fogGUIHelper, "far", near, far).listen();
            gui.addColor(fogGUIHelper, "color");
        }
    }

    function addLight(position) {
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(...position);
        scene.add(light);
        scene.add(light.target);
    }
    addLight([-3, 1, 1]);
    addLight([2, 1, 0.5]);

    const bodyRadiusTop = 0.4;
    const bodyRadiusBottom = 0.2;
    const bodyHeight = 2;
    const bodyRadialSegments = 6;
    const bodyGeometry = new THREE.CylinderBufferGeometry(bodyRadiusTop, bodyRadiusBottom, bodyHeight, bodyRadialSegments);

    const headRadius = bodyRadiusTop * 0.8;
    const headLonSegments = 12;
    const headLatSegments = 5;
    const headGeometry = new THREE.SphereBufferGeometry(headRadius, headLonSegments, headLatSegments);

    function makeLabelCanvas(baseWidth, size, name) {
        const borderSize = 2;
        const ctx = document.createElement("canvas").getContext("2d");
        const font = `${size}px bold sans-serif`;
        ctx.font = font;

        const textWidth = ctx.measureText(name).width;

        const doubleBorderSize = borderSize * 2;
        const width = baseWidth + doubleBorderSize;
        const height = size + doubleBorderSize;
        ctx.canvas.width = width;
        ctx.canvas.height = height;

        ctx.font = font;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        ctx.fillStyle = "blue";
        ctx.fillRect(0, 0, width, height);

        const scaleFactor = Math.min(1, baseWidth / textWidth);
        ctx.translate(width / 2, height / 2);
        ctx.scale(scaleFactor, 1);
        ctx.fillStyle = "white";
        ctx.fillText(name, 0, 0);

        return ctx.canvas;
    }

    function makePerson(x, y, labelWidth, size, name, color) {
        const canvas = makeLabelCanvas(labelWidth, size, name);
        const texture = new THREE.CanvasTexture(canvas);

        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const labelMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color,
            flatShading: true,
        });

        //Khoảng cách hình
        const root = new THREE.Object3D();
        root.position.x = x;
        root.position.y = y;

        //vị trị body(thân)
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        root.add(body);
        body.position.y = bodyHeight / 2;

        //vị trí head(đầu)
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        root.add(head);
        head.position.y = bodyHeight + headRadius * 1.1;

        const labelBaseScale = 0.01;
        const label = new THREE.Sprite(labelMaterial);
        root.add(label);
        label.position.y = head.position.y + headRadius + size * labelBaseScale;

        label.scale.x = canvas.width * labelBaseScale;
        label.scale.y = canvas.height * labelBaseScale;

        scene.add(root);

        //shadow
        body.castShadow = true;
        body.receiveShadow = true;

        //Hiển thị hình theo ý muốn(Rendering on Demand)
        const folder = gui.addFolder(`body${x}`);
        folder.addColor(new ColorGUIHelper(bodyMaterial, "color"), "value").name("color").onChange(requestAnimationFrame);
        folder.add(body.scale, "x", 0.1, 1.5).name("scale x").onChange(requestAnimationFrame);
        folder.open();

        return body;
    }

    makePerson(-3, 4, 110, 32, "Người vàng", "yellow");
    makePerson(-0, 4, 150, 32, "Người xanh", "green");
    makePerson(+3, 4, 150, 32, "Người đỏ", "red");

    //Change the color of a GLTF Model
    const materialGltf = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        specular: 0xd81919,
        shininess: 50,
    });
    //Bảng màu trên control
    const params = {
        modelcolor: 0xff0000, //RED
    };

    const folder = gui.addFolder("Model Color");
    folder
        .addColor(params, "modelcolor")
        .name("Car Color")
        .listen()
        .onChange(function () {
            materialGltf.color.set(params.modelcolor);
        });

    //Change color cube
    //Đổi màu Box
    folder
        .addColor(params, "modelcolor")
        .name("Box Color")
        .listen()
        .onChange(function () {
            {
                cubeMat.color.set(params.modelcolor);
            }
        });
    folder.open();

    //add file gltf and add all tab controls in one
    let cars;
    let carsSize = 0;

    //. Look to Select with GLTF model
    let pickableMeshes = [];
    {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load("./q/scene.gltf", (gltf) => {
            gltf.scene.traverse(function (node) {
                if (node.isMesh) {
                    //đổ bóng
                    node.castShadow = true;
                }
            });

            //Change the color of a GLTF Model
            const meshMaterial = materialGltf;
            const model = new THREE.Mesh(gltf, meshMaterial);

            gltf.scene.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material = materialGltf;
                }
            });
            scene.add(gltf.scene);
            cars = gltf.scene;

            //. Look to Select with GLTF model
            cars.traverse((node) => {
                if (node instanceof THREE.Mesh) {
                    pickableMeshes.push(node);
                }
            });

            cars.position.set(-carsSize - 1, carsSize + 5, 0);
            cars.traverse((node) => {
                if (node instanceof THREE.Mesh) {
                    pickableMeshes.push(node);
                }
            });
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

    function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        cameraPole.rotation.y = time * 0.1;

        pickHelper.pick(pickPosition, scene, camera, time);

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    function getCanvasRelativePosition(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    function setPickPosition(event) {
        const pos = getCanvasRelativePosition(event);
        pickPosition.x = (pos.x / canvas.clientWidth) * 2 - 1;
        pickPosition.y = (pos.y / canvas.clientHeight) * -2 + 1;
    }

    function clearPickPosition() {
        pickPosition.x = -100000;
        pickPosition.y = -100000;
    }
    window.addEventListener("mousemove", setPickPosition);
    window.addEventListener("mouseout", clearPickPosition);
    window.addEventListener("mouseleave", clearPickPosition);

    window.addEventListener(
        "touchstart",
        (event) => {
            event.preventDefault();
            setPickPosition(event.touches[0]);
        },
        { passive: false }
    );

    window.addEventListener("touchmove", (event) => {
        setPickPosition(event.touches[0]);
    });

    window.addEventListener("touchend", clearPickPosition);
}
main();
