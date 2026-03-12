// Matter.js Module Aliases
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Constraint = Matter.Constraint,
      Body = Matter.Body,
      Events = Matter.Events,
      Query = Matter.Query,
      Vector = Matter.Vector;

// 1. Create Engine and World
const engine = Engine.create();
const world = engine.world;
engine.world.gravity.y = 1;

// 2. Create Renderer
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: '#1a1a1a'
    }
});

// 3. Create Ground and Walls
const wallOptions = { isStatic: true, render: { fillStyle: '#444' } };
const wallThickness = 60;
const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + wallThickness / 2 - 20, window.innerWidth, wallThickness, wallOptions);
const leftWall = Bodies.rectangle(-wallThickness / 2, window.innerHeight / 2, wallThickness, window.innerHeight * 2, wallOptions);
const rightWall = Bodies.rectangle(window.innerWidth + wallThickness / 2, window.innerHeight / 2, wallThickness, window.innerHeight * 2, wallOptions);
const ceiling = Bodies.rectangle(window.innerWidth / 2, -wallThickness / 2, window.innerWidth, wallThickness, wallOptions);

Composite.add(world, [ground, leftWall, rightWall, ceiling]);

// 4. Implement Mouse Interaction
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2, // Elasticity of pull
        render: { visible: false } // Hidden line
    }
});
Composite.add(world, mouseConstraint);
render.mouse = mouse;

// ---------- UI Polish: Hover effect on objects ----------
let hoveredBody = null;

// detects body under cursor
Events.on(engine, 'beforeUpdate', function() {
    const bodies = Composite.allBodies(world);
    const dynamicBodies = bodies.filter(b => !b.isStatic);
    const mousePosition = mouse.position;
    
    // Disable hover highlight if currently dragging an object
    if (mouseConstraint.body) {
        hoveredBody = null;
        return;
    }

    // Check which bodies the mouse is hovering over
    const intersections = Query.point(dynamicBodies, mousePosition);
    if (intersections.length > 0) {
        hoveredBody = intersections[0];
    } else {
        hoveredBody = null;
    }
});

// Draws glowing outline around hovered body
Events.on(render, 'afterRender', function() {
    if (hoveredBody && !mouseConstraint.body) {
        const ctx = render.context;
        
        ctx.beginPath();
        const vertices = hoveredBody.vertices;
        
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j++) {
            ctx.lineTo(vertices[j].x, vertices[j].y);
        }
        ctx.lineTo(vertices[0].x, vertices[0].y);
        
        // Glow effect
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.stroke();
        
        // Reset shadow for performace
        ctx.shadowBlur = 0; 
    }
});

// ---------- Keyboard Control Logic (A/D to Rotate) ----------
const keys = { a: false, d: false };
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'a' || key === 'd') keys[key] = true;
});
window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'a' || key === 'd') keys[key] = false;
});

Events.on(engine, 'beforeUpdate', function() {
    // Determine which body to rotate: either the one we are dragging, or the one we are hovering
    let targetBody = mouseConstraint.body || hoveredBody;
    
    if (targetBody && !targetBody.isStatic) {
        // Find if this body is part of a ragdoll (to rotate the whole torso instead of just an arm)
        if (targetBody.parentRagdoll) {
            targetBody = targetBody.parentRagdoll.torso;
        }

        const rotationSpeed = 0.08;
        if (keys.a) {
            Body.setAngularVelocity(targetBody, -rotationSpeed);
        }
        if (keys.d) {
            Body.setAngularVelocity(targetBody, rotationSpeed);
        }
    }
});

// ---------- Blood Particle System ----------
const maxBloodParticles = 150;
const bloodParticles = [];

function spawnBlood(x, y, amount, velocityX = 0, velocityY = 0) {
    for (let i = 0; i < amount; i++) {
        // Re-use particles if we reached the limit
        if (bloodParticles.length > maxBloodParticles) {
            const oldDrop = bloodParticles.shift();
            World.remove(world, oldDrop); // NOTE: Requires World to be aliased, or just Composite.remove
            Composite.remove(world, oldDrop);
        }

        const drop = Bodies.circle(x, y, Math.random() * 2 + 1, {
            restitution: 0.1,
            friction: 0.5,
            density: 0.1,
            render: { fillStyle: '#990000' },
            collisionFilter: { group: -1 } // Blood doesn't visibly collide with limbs, just walls/floor usually
        });
        
        // Scatter velocity
        const vx = velocityX * 0.2 + (Math.random() - 0.5) * 5;
        const vy = velocityY * 0.2 + (Math.random() - 0.5) * 5;
        Body.setVelocity(drop, { x: vx, y: vy });

        bloodParticles.push(drop);
        Composite.add(world, drop);
    }
}

// Draw blood particles slightly differently if needed (they are just rigid bodies for now)


// ---------- Ragdoll Creation Logic ----------
const ragdolls = [];

function createRagdoll(x, y) {
    const group = Body.nextGroup(true); // Don't allow connected limbs to collide directly
    
    // Appearance and mass settings for different body parts
    const headOptions = { collisionFilter: { group: group }, friction: 0.8, density: 0.05, render: { fillStyle: '#ffccaa' } };
    const torsoOptions = { collisionFilter: { group: group }, friction: 0.8, density: 0.05, render: { fillStyle: '#4444cc' } };
    const limbOptions = { collisionFilter: { group: group }, friction: 0.8, density: 0.05, render: { fillStyle: '#aa7744' } };
    const lowerLimbOptions = { collisionFilter: { group: group }, friction: 0.8, density: 0.05, render: { fillStyle: '#ffccaa' } };

    // Body parts definitions
    const head = Bodies.circle(x, y - 60, 15, headOptions);
    const torso = Bodies.rectangle(x, y - 15, 30, 50, torsoOptions);
    
    const leftUpperArm = Bodies.rectangle(x - 22, y - 30, 12, 30, limbOptions);
    const leftLowerArm = Bodies.rectangle(x - 22, y, 10, 30, lowerLimbOptions);

    const rightUpperArm = Bodies.rectangle(x + 22, y - 30, 12, 30, limbOptions);
    const rightLowerArm = Bodies.rectangle(x + 22, y, 10, 30, lowerLimbOptions);
    
    const leftUpperLeg = Bodies.rectangle(x - 8, y + 25, 14, 40, limbOptions);
    const leftLowerLeg = Bodies.rectangle(x - 8, y + 65, 12, 40, lowerLimbOptions);

    const rightUpperLeg = Bodies.rectangle(x + 8, y + 25, 14, 40, limbOptions);
    const rightLowerLeg = Bodies.rectangle(x + 8, y + 65, 12, 40, lowerLimbOptions);

    // Grouping parts into a Composite
    const person = Composite.create({ label: "ragdoll" });
    Composite.add(person, [
        head, torso,
        leftUpperArm, leftLowerArm, rightUpperArm, rightLowerArm,
        leftUpperLeg, leftLowerLeg, rightUpperLeg, rightLowerLeg
    ]);

    // Tag all bodies with a reference to their parent ragdoll for easy lookup later
    [head, torso, leftUpperArm, leftLowerArm, rightUpperArm, rightLowerArm, leftUpperLeg, leftLowerLeg, rightUpperLeg, rightLowerLeg].forEach(b => {
        b.parentRagdoll = person;
    });

    // Add custom properties to the composite
    person.health = 100;
    person.isAlive = true;
    person.isConscious = true;
    person.heartRate = 72;
    person.bloodVolume = 100; // Percentage
    person.painLevel = 0;

    person.head = head;
    person.torso = torso;
    person.leftUpperLeg = leftUpperLeg;
    person.rightUpperLeg = rightUpperLeg;

    // Joint stiffness and damping (easier to rip off later if needed)
    const jointOptions = { stiffness: 0.9, damping: 0.1, length: 0, render: { visible: false } };

    // Head to Torso
    Composite.add(person, Constraint.create({
        bodyA: head, bodyB: torso,
        pointA: { x: 0, y: 15 }, pointB: { x: 0, y: -25 },
        ...jointOptions
    }));

    // Shoulders
    Composite.add(person, Constraint.create({
        bodyA: torso, bodyB: leftUpperArm,
        pointA: { x: -15, y: -20 }, pointB: { x: 0, y: -15 },
        ...jointOptions
    }));
    Composite.add(person, Constraint.create({
        bodyA: torso, bodyB: rightUpperArm,
        pointA: { x: 15, y: -20 }, pointB: { x: 0, y: -15 },
        ...jointOptions
    }));

    // Elbows
    Composite.add(person, Constraint.create({
        bodyA: leftUpperArm, bodyB: leftLowerArm,
        pointA: { x: 0, y: 15 }, pointB: { x: 0, y: -15 },
        ...jointOptions
    }));
    Composite.add(person, Constraint.create({
        bodyA: rightUpperArm, bodyB: rightLowerArm,
        pointA: { x: 0, y: 15 }, pointB: { x: 0, y: -15 },
        ...jointOptions
    }));

    // Hips
    Composite.add(person, Constraint.create({
        bodyA: torso, bodyB: leftUpperLeg,
        pointA: { x: -10, y: 25 }, pointB: { x: 0, y: -20 },
        ...jointOptions
    }));
    Composite.add(person, Constraint.create({
        bodyA: torso, bodyB: rightUpperLeg,
        pointA: { x: 10, y: 25 }, pointB: { x: 0, y: -20 },
        ...jointOptions
    }));

    // Knees
    Composite.add(person, Constraint.create({
        bodyA: leftUpperLeg, bodyB: leftLowerLeg,
        pointA: { x: 0, y: 20 }, pointB: { x: 0, y: -20 },
        ...jointOptions
    }));
    Composite.add(person, Constraint.create({
        bodyA: rightUpperLeg, bodyB: rightLowerLeg,
        pointA: { x: 0, y: 20 }, pointB: { x: 0, y: -20 },
        ...jointOptions
    }));

    // Store joints for angle limits (Elbows and Knees)
    person.angleLimits = [
        // Elbows (bend forward only)
        { bodyA: leftUpperArm, bodyB: leftLowerArm, min: -Math.PI * 0.8, max: 0.1 },
        { bodyA: rightUpperArm, bodyB: rightLowerArm, min: -Math.PI * 0.8, max: 0.1 },
        // Knees (bend backward only)
        { bodyA: leftUpperLeg, bodyB: leftLowerLeg, min: -0.1, max: Math.PI * 0.8 },
        { bodyA: rightUpperLeg, bodyB: rightLowerLeg, min: -0.1, max: Math.PI * 0.8 },
    ];

    ragdolls.push(person);
    return person;
}

// ---------- Ragdoll Logic Update ----------
Events.on(engine, 'beforeUpdate', function() {
    ragdolls.forEach(person => {
        // Enforce Joint Limits
        if (person.angleLimits) {
            person.angleLimits.forEach(limit => {
                let relAngle = limit.bodyB.angle - limit.bodyA.angle;
                // Normalize angle between -PI and PI
                relAngle = Math.atan2(Math.sin(relAngle), Math.cos(relAngle));
                
                if (relAngle < limit.min) {
                    const diff = limit.min - relAngle;
                    Matter.Body.setAngularVelocity(limit.bodyA, limit.bodyA.angularVelocity - diff * 0.1);
                    Matter.Body.setAngularVelocity(limit.bodyB, limit.bodyB.angularVelocity + diff * 0.1);
                } else if (relAngle > limit.max) {
                    const diff = relAngle - limit.max;
                    Matter.Body.setAngularVelocity(limit.bodyA, limit.bodyA.angularVelocity + diff * 0.1);
                    Matter.Body.setAngularVelocity(limit.bodyB, limit.bodyB.angularVelocity - diff * 0.1);
                }
            });
        }

        // Alive & Balance Logic
        if (person.isAlive && person.isConscious) {
            // Keep torso upright
            const torsoAngle = person.torso.angle;
            person.torso.torque = -torsoAngle * 0.08 * person.torso.mass;
            
            // Keep head upright relative to torso
            const headRelAngle = person.head.angle - person.torso.angle;
            person.head.torque = -headRelAngle * 0.05 * person.head.mass;

            // Keep upper legs somewhat straight down to simulate standing
            person.leftUpperLeg.torque = -person.leftUpperLeg.angle * 0.05 * person.leftUpperLeg.mass;
            person.rightUpperLeg.torque = -person.rightUpperLeg.angle * 0.05 * person.rightUpperLeg.mass;
        }

        // Very basic trauma/damage logic based on impact/velocity (to be expanded)
        const speed = Vector.magnitude(person.torso.velocity);
        
        // Impact Damage
        if (speed > 35 && person.isConscious) {
            person.health -= 15;
            person.painLevel += 40; // Sudden pain spike
            
            // Spawn some blood on heavy impact
            if (speed > 55 && person.bloodVolume > 0) {
                spawnBlood(person.torso.position.x, person.torso.position.y, 5, person.torso.velocity.x, person.torso.velocity.y);
                person.bloodVolume -= 2;
                person.isBleeding = true; // Trigger sustained bleeding state
            }

            // Go limp if hurt
            if (person.health <= 0) {
                person.isAlive = false;
                person.isConscious = false;
                person.heartRate = 0;
            } else if (person.health < 50) {
                person.isConscious = false;
            }
            
            if (!person.isConscious) {
                person.torso.render.fillStyle = '#666666'; 
            }
        }

        // Bleeding out logic over time
        if (person.isAlive && person.isBleeding && person.bloodVolume > 0) {
            // Heart beats pump blood out faster
            const bleedRate = (person.heartRate / 72) * 0.05; 
            person.bloodVolume -= bleedRate;
            
            // Visual blood drip every so often
            if (Math.random() < 0.1 * bleedRate) {
                 spawnBlood(person.torso.position.x, person.torso.position.y + 10, 1);
            }
        }

        // Heart rate logic (simple simulation)
        if (person.isAlive) {
            // Heart rate increases with pain, decreases with low blood
            let targetHR = 72 + person.painLevel * 0.5;
            if (person.bloodVolume < 50) targetHR += 40; // Tachycardia to compensate
            if (person.bloodVolume < 20) targetHR -= 60; // Failing heart
            
            // Smoothly adjust current heart rate towards target
            person.heartRate += (targetHR - person.heartRate) * 0.05;

            // Natural pain decay
            if (person.painLevel > 0) person.painLevel -= 0.1;

            // Death condition
            if (person.bloodVolume <= 0 || person.heartRate <= 0) {
                person.isAlive = false;
                person.isConscious = false;
                person.heartRate = 0;
                person.torso.render.fillStyle = '#333333'; // Dark dead color
            }
        }
    });
});

// ---------- UI Interaction: Context Menu & Inspector ----------
const contextMenu = document.getElementById('context-menu');
const inspectorPanel = document.getElementById('inspector-panel');
const btnInspect = document.getElementById('menu-inspect');
const btnCloseInspector = document.getElementById('close-inspector');

let selectedRagdoll = null;
let inspectedRagdoll = null;

// Right-click listener on canvas
render.canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    
    // Hide menu initially
    contextMenu.classList.add('hidden');
    selectedRagdoll = null;

    // Find bodies under cursor
    const mousePos = { x: e.clientX, y: e.clientY };
    const bodies = Composite.allBodies(world);
    const clickedBodies = Query.point(bodies, mousePos);

    if (clickedBodies.length > 0) {
        // Check if a ragdoll part was clicked
        const clickedBody = clickedBodies[0];
        if (clickedBody.parentRagdoll) {
            selectedRagdoll = clickedBody.parentRagdoll;
            
            // Show menu at mouse position
            contextMenu.style.left = e.clientX + 'px';
            contextMenu.style.top = e.clientY + 'px';
            contextMenu.classList.remove('hidden');
        }
    }
});

// Hide context menu on normal click anywhere
window.addEventListener('click', (e) => {
    if (e.target.id !== 'menu-inspect') {
        contextMenu.classList.add('hidden');
    }
});

// Click "Inspect" inside context menu
btnInspect.addEventListener('click', () => {
    if (selectedRagdoll) {
        inspectedRagdoll = selectedRagdoll;
        inspectorPanel.classList.remove('hidden');
        contextMenu.classList.add('hidden');
    }
});

// Close Inspector
btnCloseInspector.addEventListener('click', () => {
    inspectorPanel.classList.add('hidden');
    inspectedRagdoll = null;
});

// Update Inspector Panel UI Loop
setInterval(() => {
    if (!inspectedRagdoll || inspectorPanel.classList.contains('hidden')) return;

    const r = inspectedRagdoll;
    
    // Status text and color
    const elStatus = document.getElementById('insp-status');
    if (!r.isAlive) {
        elStatus.textContent = "Deceased";
        elStatus.className = "status-dead";
    } else if (!r.isConscious) {
        elStatus.textContent = "Unconscious";
        elStatus.className = "status-unconscious";
    } else {
        elStatus.textContent = "Alive";
        elStatus.className = "status-alive";
    }

    // Consciousness
    document.getElementById('insp-conscious').textContent = r.isConscious ? "Aware" : "Unresponsive";
    
    // Vitals
    document.getElementById('insp-hr').textContent = Math.round(r.heartRate) + " bpm";
    document.getElementById('insp-blood').textContent = Math.round(r.bloodVolume) + "%";
    
    // Pain
    let painText = "None";
    if (r.painLevel > 70) painText = "Extreme";
    else if (r.painLevel > 40) painText = "Severe";
    else if (r.painLevel > 10) painText = "Moderate";
    document.getElementById('insp-pain').textContent = painText;

}, 100); // Update 10 times a second

// 5. Add a test ragdoll to the scene
const testRagdoll = createRagdoll(window.innerWidth / 2, 200);
Composite.add(world, testRagdoll);

// Add an extra box for throwing at the ragdoll
const boxA = Bodies.rectangle(window.innerWidth / 2 - 150, 100, 80, 80, { render: { fillStyle: '#ff5555' } });
Composite.add(world, boxA);

// 6. Run Engine and Renderer
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Handle window resizing
window.addEventListener('resize', () => {
    // Update canvas size
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    render.options.width = window.innerWidth;
    render.options.height = window.innerHeight;
    
    // Re-adjust ground and wall
    Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + wallThickness / 2 - 20 });
    Matter.Body.setPosition(rightWall, { x: window.innerWidth + wallThickness / 2, y: window.innerHeight / 2 });
});
