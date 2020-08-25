class SphereNode{
    constructor(sphereMesh, scaleLimit, sphereID){
        this.sphereMesh = sphereMesh;
        this.sphereID = sphereID;
        this.scaleLimit = scaleLimit;
        this.scaleReset = 0;
        this.edges = [];
    }

    animate(){
        this.sphereMesh.rotation.y +=  0.05;
        if (this.sphereMesh.scale.x >= this.scaleLimit){
            this.scaleReset = 1
        }
        if (this.sphereMesh.scale.x < this.scaleLimit && this.scaleReset == 0){
            this.sphereMesh.scale.x += 0.01;
            this.sphereMesh.scale.y += 0.01;
        }
        if (this.sphereMesh.scale.x < 1){
            this.scaleReset = 0;
        }
        else if (this.scaleReset == 1){
            this.sphereMesh.scale.x -= 0.01;
            this.sphereMesh.scale.y -= 0.01;
        }
    }

    onClickSphere(event){
        if(clickEdges == 1){
            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2();
            event.preventDefault();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            var intersection = raycaster.intersectObjects(scene.children, true);
            
            if (graph.clickedObj == null){
                for(var i = 0; i < intersection.length; i++){
                    if(intersection[i].object.type == "Mesh"){
                        intersection[i].object.material.color.set(0xFFF000);
                        graph.clickedObj = intersection[i];
                    }
                }
            }
            else{
                var nodeA = null;
                var nodeB = null;
                for (var i = 0; i < graph.sphereNodes.length; i++){
                    if (graph.sphereNodes[i].sphereMesh.uuid == graph.clickedObj.object.uuid){
                        nodeA = graph.sphereNodes[i];
                    }
                    if (graph.sphereNodes[i].sphereMesh.uuid == intersection[0].object.uuid){
                        nodeB = graph.sphereNodes[i];
                    }
                }

                var edge = new Edge(nodeA, nodeB);
                nodeA.addEdge(edge);
                nodeB.addEdge(edge);
                graph.clickedObj.object.material.color.set(0xFFFFFF);
                graph.clickedObj = null;
            }
        }
    }

    addEdge(edge){
        this.edges.push(edge);
    }

    changeColor(color){
        this.sphereMesh.material.color.set(color);
    }
}

class Edge{
    constructor(SphereNodeA, SphereNodeB){
        this.nodeA = SphereNodeA;
        this.nodeB = SphereNodeB;
        var aPos = SphereNodeA.sphereMesh.position;
        var bPos = SphereNodeB.sphereMesh.position;
        var points = [new THREE.Vector3(aPos.x, aPos.y, aPos.z)];
        points.push(new THREE.Vector3(bPos.x, bPos.y, bPos.z));
        
        var edgeMaterial = new THREE.LineBasicMaterial({color: "white"});
        var edgeGeo = new THREE.BufferGeometry().setFromPoints(points);
        this.edge = new THREE.Line(edgeGeo, edgeMaterial);
        scene.add(this.edge);
    }

    changeColor(color){
        this.edge.material.color.set(color);
    }
}

class Graph{
    constructor(numNodes, isRand){
        this.sphereNodes = [];
        this.offset = -2*numNodes - 0.2*numNodes;
        this.closedSet = [];
        this.consideredEdges = [];
        this.clickedObj = null;
        this.isRand = isRand;
        
        if(isRand){
            this.placeRandNodes(numNodes);
            this.createEdges();
        }
    }
    
    placeRandNodes(numNodes){
        for (var i = 0; i < numNodes; i ++){
            var sphereGeo = new THREE.SphereGeometry(1, 10, 100);
            var sphereMaterial = new THREE.MeshLambertMaterial(0xFFFFFF);
            var sphereMesh = new THREE.Mesh(sphereGeo, sphereMaterial);
            sphereMesh.position.x = this.offset;
            sphereMesh.position.y = Math.random() * 20 - 10;
            this.offset = this.offset + 5;
            this.sphereNodes.push(new SphereNode(sphereMesh, 1.15, i));
            scene.add(sphereMesh);
            window.addEventListener("click", this.sphereNodes[i].onClickSphere);
        }
    }

    placeNode(){
        var vec = new THREE.Vector3();
        var pos = new THREE.Vector3();
        vec.set(mouseX, mouseY, 0.5);
        vec.unproject(camera);
        vec.sub(camera.position);
        var distance = -camera.position.z/vec.z;
        pos.copy(camera.position).add(vec.multiplyScalar(distance));

        if(pos.x < -25 || pos.x > 26|| pos.y < -10 || pos.y > 20){
            return;
        }

        var sphereGeo = new THREE.SphereGeometry(1, 10, 100);
        var sphereMaterial = new THREE.MeshLambertMaterial(0xFFFFFF);
        var sphereMesh = new THREE.Mesh(sphereGeo, sphereMaterial);
        sphereMesh.position.x = pos.x
        sphereMesh.position.y = pos.y;
        sphereMesh.position.z = pos.z;
        this.sphereNodes.push(new SphereNode(sphereMesh, 1.15, i));
        scene.add(sphereMesh);
        
    }
    createEdges(){
        for (var i = 0; i < this.sphereNodes.length - 1; i++){
            var edge = new Edge(this.sphereNodes[i], this.sphereNodes[i+1]);
            this.sphereNodes[i].addEdge(edge);
            this.sphereNodes[i+1].addEdge(edge);
            if(Math.random() > 0.5 && i + 2 < this.sphereNodes.length){
                var edge = new Edge(this.sphereNodes[i], this.sphereNodes[i+2]);
                this.sphereNodes[i].addEdge(edge);
                this.sphereNodes[i+2].addEdge(edge);
            }
        }
    }

    findMaxIndependentSet(){
        var openSet = [];
        for (var i = 0; i < this.sphereNodes.length; i++){
            openSet.push(this.sphereNodes[i]);
        }
        
        while (openSet.length > 0){
            var vertex = openSet[0];
            this.closedSet.push(vertex);
            for (var i = 0; i<vertex.edges.length; i++){
                this.consideredEdges.push(vertex.edges[i]);
                var pos = -1;
                for (var idx = 0; idx < openSet.length; idx++){
                    if(vertex.edges[i].nodeB.sphereID == openSet[idx].sphereID){
                        pos = idx;
                    }
                }
                if (pos != -1){
                    openSet.splice(pos, 1);
                }
            }
            openSet.shift();
        }
        
    }

    identify(){
        for (let i = 0; i < this.closedSet.length; i++){
            setTimeout(function(vert){
                setTimeout(function(vert){vert.changeColor(0xFF0000);}, 100, vert);
            }, 250 *i , this.closedSet[i]);
        }
        
        for (let i = 0; i < this.consideredEdges.length; i++){
            setTimeout(function(vert){
                setTimeout(function(vert){vert.changeColor(0xCC000C);}, 1000, vert);
            }, 250 *i , this.consideredEdges[i]);
        }
    }


    remove(){
        for (var i = 0; i < this.sphereNodes.length; i++){
            scene.remove(this.sphereNodes[i].sphereMesh);
            for (var idx = 0; idx < this.sphereNodes[i].edges.length; idx++){
                scene.remove(this.sphereNodes[i].edges[idx].edge);
            }
        }
    }
        
}
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 1000);
var renderer = new THREE.WebGLRenderer({antialias: true});
var light = new THREE.PointLight(0xFFFFFF, 10, 10000);
var amblight = new THREE.AmbientLight(0x404040);
var numNodes = 20;
var mouseX = 0;
var mouseY = 0;
var clickVertices = 0; // used to keep track of mouse click/release
var clickEdges = 0;
light.position.set(25,50,25);
camera.position.z = 50 + numNodes;
renderer.setClearColor("black");
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
})

var graph = new Graph(numNodes, true);
var sphereNodes = graph.sphereNodes;

var starGeo = new THREE.Geometry();
for (var i = 0; i < 5000; i++){
    var star = new THREE.Vector3(Math.random() * 600 - 300, Math.random() * 600 - 300, Math.random() * 600 - 300 );
    star.velocity = 0;
    star.acceleration = 0.002;
    starGeo.vertices.push(star);
}
var sprite = new THREE.TextureLoader().load("star.png");
var starMaterial = new THREE.PointsMaterial({color: 0xAAAAAA, size: 0.8, map: sprite});

var stars = new THREE.Points(starGeo, starMaterial);
scene.add(stars);

var render = function(){
    starGeo.vertices.forEach(p=>{
        p.velocity += p.acceleration;
        p.z += p.velocity;
        if(p.z > 200){
            p.z = -400;
            p.velocity = 0;
        }
    });
    starGeo.verticesNeedUpdate = true;
    stars.rotation.z += 0.002;
    requestAnimationFrame(render);
    for (var i = 0; i < graph.sphereNodes.length; i++){
        graph.sphereNodes[i].animate();
    }
    renderer.render(scene, camera);
}

scene.add(light);
scene.add(amblight);
render();
document.getElementById("randomFind").addEventListener("click", () => {
    document.getElementById("doneEdges").style.visibility = "hidden";
    document.getElementById("drawArea").style.visibility = "hidden";
    document.getElementById("resetCustom").style.visibility = "hidden";
    document.getElementById("doneVertices").style.visibility = "hidden";
    clickEdges = 0;
    graph.findMaxIndependentSet();
    graph.identify();
});
document.getElementById("reset").addEventListener("click", () => {
    graph.remove();
    graph = new Graph(numNodes, true);
    document.getElementById("doneVertices").style.visibility = "hidden";
    document.getElementById("doneEdges").style.visibility = "hidden";
    document.getElementById("drawArea").style.visibility = "hidden";
    document.getElementById("resetCustom").style.visibility = "hidden";

});

document.getElementById("createCustom").addEventListener("click", () => {
    if(graph.isRand){
        graph.remove();
        graph = new Graph(0, false);
    }
    clickVertices = 1;
    document.getElementById("doneVertices").style.visibility = "visible";
    document.getElementById("doneEdges").style.visibility = "hidden";
    document.getElementById("drawArea").style.visibility = "visible";
    document.getElementById("resetCustom").style.visibility = "visible";
});

document.addEventListener("click", (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    if(clickVertices == 1){
        graph.placeNode();
    }
});

document.getElementById("doneVertices").addEventListener("click", () =>{
    document.getElementById("doneVertices").style.visibility = "hidden";
    document.getElementById("doneEdges").style.visibility = "visible";
    document.getElementById("resetCustom").style.visibility = "visible";
    clickVertices = 0;
    clickEdges = 1;
});

document.getElementById("doneEdges").addEventListener("click", () =>{
    document.getElementById("doneEdges").style.visibility = "hidden";
    document.getElementById("drawArea").style.visibility = "hidden";
    document.getElementById("resetCustom").style.visibility = "hidden";
    clickEdges = 0;
});

document.getElementById("resetCustom").addEventListener("click", () =>{
    graph.remove();
    graph = new Graph(0, false);
    document.getElementById("doneVertices").style.visibility = "visible";
    document.getElementById("doneEdges").style.visibility = "hidden";
    document.getElementById("drawArea").style.visibility = "visible";
    document.getElementById("resetCustom").style.visibility = "visible";
    clickVertices = 1;
    clickEdges = 0;
});