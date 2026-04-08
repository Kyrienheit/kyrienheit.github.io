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
      Vector = Matter.Vector,
      Common = Matter.Common;

// 1. Create Engine and World
// Setup decomp for concave polygons (Pistol)
if (typeof window.decomp !== 'undefined') {
    Common.setDecomp(window.decomp);
}

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
        background: '#1a1a1a',
        hasBounds: true
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

// ---------- Global Mouse Tracking ----------
const currentMousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

window.addEventListener('mousemove', (e) => {
    currentMousePos.x = e.clientX;
    currentMousePos.y = e.clientY;
});

// ---------- Keyboard Control Logic (A/D/E/Q/F) ----------
const keys = { a: false, d: false, f: false };

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;
    
    // Spawn Logic Q (Left) / E (Right)
    if (key === 'e' || key === 'q') {
        if (!spawnMode) return;
        
        // Use the globally tracked mouse position because `mouse.position` from matter might not be updated when holding mouse still
        const mouseX = currentMousePos.x;
        const mouseY = currentMousePos.y;
        
        console.log(`[Spawn] Attempting to spawn '${spawnMode}' at {x: ${mouseX}, y: ${mouseY}}`);

        // No offset needed, spawn right at mouse tip
        if (spawnMode === 'ragdoll') createRagdoll(mouseX, mouseY);
        else if (spawnMode === 'normalbox') createNormalBox(mouseX, mouseY);
        else if (spawnMode === 'box') createDestructibleBox(mouseX, mouseY);
        else if (spawnMode === 'pistol') createPistol(mouseX, mouseY);
        else if (spawnMode === 'syringe-adrenaline') createSyringe(mouseX, mouseY);
        
        console.log(`[Spawn] Spawn complete.`);
    }
    
    // Firing Logic F
    if (key === 'f') {
        // Find if we are holding a pistol with the mouse
        const holdBody = mouseConstraint.body;
        if (holdBody && holdBody.label === 'pistol') {
            firePistol(holdBody);
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
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
    console.log(`[Ragdoll] Creating ragdoll at ${x}, ${y}`);
    const group = Body.nextGroup(true); // Don't allow connected limbs to collide directly
    
    // Appearance and mass settings for different body parts
    const headOptions = { collisionFilter: { group: group }, friction: 0.8, density: 0.05, render: { fillStyle: '#ffccaa' } };
    const torsoOptions = { collisionFilter: { group: group }, friction: 0.8, density: 0.05, render: { fillStyle: '#4444cc' } };
    const limbOptions = { collisionFilter: { group: group }, friction: 0.8, density: 0.05, render: { fillStyle: '#aa7744' } };
    const lowerLimbOptions = { collisionFilter: { group: group }, friction: 0.8, density: 0.05, render: { fillStyle: '#ffccaa' } };

    // Body parts definitions
    console.log(`[Ragdoll] Creating parts...`);
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
    person.leftLowerLeg = leftLowerLeg;
    person.rightLowerLeg = rightLowerLeg;

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
    Composite.add(world, person); // CRITICAL: Actually add the ragdoll to the physics world!
    
    console.log(`[Ragdoll] Ragdoll created and added to world.`);
    return person;
}

// ---------- Props & Weapons Creation Logic ----------
const destructibleBoxes = [];

function createNormalBox(x, y) {
    const box = Bodies.rectangle(x, y, 60, 60, { 
        render: { fillStyle: '#999999' }, // Gray metal color
        friction: 0.8,
        density: 0.05
    });
    Composite.add(world, box);
    return box;
}

function createDestructibleBox(x, y) {
    const box = Bodies.rectangle(x, y, 60, 60, { 
        render: { fillStyle: '#8b5a2b' }, // Wood color
        friction: 0.8,
        density: 0.05
    });
    box.isDestructible = true;
    destructibleBoxes.push(box);
    Composite.add(world, box);
    return box;
}

function shatterBox(box) {
    // Remove the original box
    Composite.remove(world, box);
    const index = destructibleBoxes.indexOf(box);
    if (index > -1) destructibleBoxes.splice(index, 1);

    // Create 4 smaller pieces directly at the box position
    const { x, y } = box.position;
    const pieces = [];
    const size = 30; // Half size
    
    // Slight random velocities
    const vopts = () => (Math.random() - 0.5) * 10;
    
    pieces.push(Bodies.rectangle(x - 15, y - 15, size, size, { render: { fillStyle: '#6b4421' } }));
    pieces.push(Bodies.rectangle(x + 15, y - 15, size, size, { render: { fillStyle: '#6b4421' } }));
    pieces.push(Bodies.rectangle(x - 15, y + 15, size, size, { render: { fillStyle: '#6b4421' } }));
    pieces.push(Bodies.rectangle(x + 15, y + 15, size, size, { render: { fillStyle: '#6b4421' } }));

    pieces.forEach(p => {
        Body.setVelocity(p, { x: box.velocity.x * 0.5 + vopts(), y: box.velocity.y * 0.5 + vopts() });
        Body.setAngularVelocity(p, (Math.random() - 0.5) * 0.5);
    });

    Composite.add(world, pieces);
}

function createPistol(x, y) {
    console.log(`[Pistol] Attempting to create pistol using Body.create({ parts }) fallback.`);
    // In Matter.js, compound bodies made with 'parts' are completely solid/stiff 
    // without needing poly-decomp or constraints.
    
    // We position the parts relative to a center point so they combine cleanly into the `parts` array.
    const barrel = Bodies.rectangle(15, -5, 30, 10, { render: { fillStyle: '#444' } });
    // Grip is rotated slightly
    const grip = Bodies.rectangle(-5, 5, 10, 20, { render: { fillStyle: '#333' }, angle: Math.PI * 0.1 });
    
    const pistolBody = Body.create({
        parts: [barrel, grip],
        label: "pistol",
        friction: 0.8,
        density: 0.05
    });
    
    Body.setPosition(pistolBody, { x: x, y: y });

    Composite.add(world, pistolBody);
    console.log(`[Pistol] Pistol created as single compound body.`);
    return pistolBody;
}

function firePistol(pistolBody) {
    if (!pistolBody || pistolBody.label !== 'pistol') return;

    const angle = pistolBody.angle;
    // Length from center to barrel tip (approx)
    const barrelLength = 15; 
    
    // Using the combined body's center to calculate tip
    const barrelX = pistolBody.position.x + Math.cos(angle) * barrelLength;
    const barrelY = pistolBody.position.y + Math.sin(angle) * barrelLength;
    
    const bullet = Bodies.circle(barrelX, barrelY, 3, {
        label: "bullet",
        render: { fillStyle: '#ffcc00' },
        friction: 0.1,
        restitution: 0.2,
        density: 1.0 // Heavy for impact
    });
    
    // Very high velocity for bullet
    const bulletSpeed = 50;
    Body.setVelocity(bullet, {
        x: pistolBody.velocity.x + Math.cos(angle) * bulletSpeed,
        y: pistolBody.velocity.y + Math.sin(angle) * bulletSpeed
    });
    
    // Recoil (kickback) on the solid body
    const kickback = 2;
    Body.setVelocity(pistolBody, {
        x: pistolBody.velocity.x - Math.cos(angle) * kickback,
        y: pistolBody.velocity.y - Math.sin(angle) * kickback
    });

    Composite.add(world, bullet);
    
    // Muzzle flash particle (visual only)
    const flash = Bodies.circle(barrelX + Math.cos(angle)*5, barrelY + Math.sin(angle)*5, 5, {
        isSensor: true, render: { fillStyle: '#ffffaa' }
    });
    Composite.add(world, flash);
    setTimeout(() => Composite.remove(world, flash), 50);
}

// ---------- Ragdoll & Game Logic Update ----------
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
            // Keep torso upright with a strong PD controller effect
            const torsoAngle = person.torso.angle;
            const torsoAngularVelocity = person.torso.angularVelocity;
            // Target angle is 0 (straight up)
            person.torso.torque = (-torsoAngle * 1.5 - torsoAngularVelocity * 0.1) * person.torso.mass;
            
            // Keep head upright relative to torso
            const headRelAngle = person.head.angle - person.torso.angle;
            person.head.torque = (-headRelAngle * 0.5) * person.head.mass;

            // --- Active Leg AI (Trying to stand) ---
            // Force upper legs to point straight down
            const leftHipAngle = person.leftUpperLeg.angle;
            const rightHipAngle = person.rightUpperLeg.angle;
            
            person.leftUpperLeg.torque = (-leftHipAngle * 0.8 - person.leftUpperLeg.angularVelocity * 0.05) * person.leftUpperLeg.mass;
            person.rightUpperLeg.torque = (-rightHipAngle * 0.8 - person.rightUpperLeg.angularVelocity * 0.05) * person.rightUpperLeg.mass;

            // Force knees to stay straight (relative angle between upper and lower leg should be ~0)
            const leftKneeRelAngle = person.leftLowerLeg.angle - person.leftUpperLeg.angle;
            const rightKneeRelAngle = person.rightLowerLeg.angle - person.rightUpperLeg.angle;
            
            // Apply equal and opposite torque to straighten the knee joint
            const kneeTorqueStrength = 0.5;
            person.leftLowerLeg.torque = (-leftKneeRelAngle * kneeTorqueStrength) * person.leftLowerLeg.mass;
            person.rightLowerLeg.torque = (-rightKneeRelAngle * kneeTorqueStrength) * person.rightLowerLeg.mass;
            
            // Add a little friction to the feet (lower legs) so they don't slide out endlessly
            person.leftLowerLeg.friction = 1.0;
            person.rightLowerLeg.friction = 1.0;
        } else {
            // Unconscious/Dead characters lose leg friction to ragdoll completely
            person.leftLowerLeg.friction = 0.8;
            person.rightLowerLeg.friction = 0.8;
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

    // Destructible Box Logic Update
    destructibleBoxes.forEach(box => {
        const speed = Vector.magnitude(box.velocity);
        if (speed > 25) { // Threshold to break
            shatterBox(box);
        }
    });

    // Listen to actual collisions for destroying boxes against walls/static things
});

Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;
    for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;

        // Calculate rough impact velocity
        const relVel = Vector.sub(bodyA.velocity, bodyB.velocity);
        const impactForce = Vector.magnitude(relVel) * ((bodyA.mass * bodyB.mass) / (bodyA.mass + bodyB.mass));

        // Speed-based damage
        if (impactForce > 40 && (bodyA.isDestructible || bodyB.isDestructible)) {
            if (bodyA.isDestructible) shatterBox(bodyA);
            if (bodyB.isDestructible) shatterBox(bodyB);
        }
        
        // Syringe Injection Logic
        if (bodyA.label === 'syringe' || bodyB.label === 'syringe') {
            const syringe = bodyA.label === 'syringe' ? bodyA : bodyB;
            const target = bodyA.label === 'syringe' ? bodyB : bodyA;
            
            // Only inject if hitting hard enough (needle刺入)
            if (impactForce > 5 && target.parentRagdoll) {
                const r = target.parentRagdoll;
                if (r.isAlive) {
                    // Adrenaline Effect: Max out heart rate, wake up, slight heal
                    r.heartRate = Math.min(200, r.heartRate + 80);
                    r.isConscious = true;
                    r.painLevel = Math.max(0, r.painLevel - 20); // Adrenaline dulls pain temporarily
                    console.log("[Medical] Adrenaline injected!");
                    
                    // Could add a visual effect or pin the syringe to the body here
                    // For now, let's just delete the syringe to symbolize use
                    Composite.remove(world, syringe);
                }
            }
        }
        
        // Bullet Hit Detection
        if (bodyA.label === 'bullet' || bodyB.label === 'bullet') {
            const bullet = bodyA.label === 'bullet' ? bodyA : bodyB;
            const target = bodyA.label === 'bullet' ? bodyB : bodyA;
            
            // Remove bullet slightly after impact to simulate penetration/stopping
            setTimeout(() => Composite.remove(world, bullet), 20);

            // If bullet hits a ragdoll
            if (target.parentRagdoll) {
                const r = target.parentRagdoll;
                if (r.isAlive) {
                    r.health -= 40; // High damage
                    r.painLevel += 60;
                    r.bloodVolume -= 15; // Instant blood loss
                    r.isBleeding = true;
                    
                    if (r.health <= 0) {
                        r.isAlive = false;
                        r.isConscious = false;
                        r.heartRate = 0;
                        r.torso.render.fillStyle = '#333333';
                    }
                }
                
                // Big blood splatter
                spawnBlood(bullet.position.x, bullet.position.y, 10, bullet.velocity.x, bullet.velocity.y);
            }
        }
    }
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

// ---------- Spawn Menu Logic ----------
let spawnMode = null; // 'ragdoll', 'normalbox', 'box', 'pistol', 'syringe-adrenaline'
let toolMode = null; // 'wire', 'bandage'

const spawnBtns = document.querySelectorAll('.spawn-btn');

function setSpawnMode(mode, btnId) {
    if (spawnMode === mode || !btnId) { // added !btnId support to clear
        spawnMode = null; // Toggle off
        spawnBtns.forEach(b => b.classList.remove('active'));
        return;
    }
    spawnMode = mode;
    spawnBtns.forEach(b => b.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');
    
    // Clear tool mode if picking a spawn
    if (toolMode) setToolMode(toolMode, null);
}

// Spawn button click handlers
// On mobile → spawns immediately at centre; on desktop → select mode then Q/E to spawn
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

function mobileSpawn(mode) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.45;
    if (mode === 'ragdoll')            createRagdoll(cx, cy);
    else if (mode === 'normalbox')     createNormalBox(cx, cy);
    else if (mode === 'box')           createDestructibleBox(cx, cy);
    else if (mode === 'pistol')        createPistol(cx, cy);
    else if (mode === 'syringe-adrenaline') createSyringe(cx, cy);
}

document.getElementById('spawn-ragdoll').addEventListener('click', () => {
    if (isTouchDevice) { mobileSpawn('ragdoll'); return; }
    setSpawnMode('ragdoll', 'spawn-ragdoll');
});
document.getElementById('spawn-normal-box').addEventListener('click', () => {
    if (isTouchDevice) { mobileSpawn('normalbox'); return; }
    setSpawnMode('normalbox', 'spawn-normal-box');
});
document.getElementById('spawn-box').addEventListener('click', () => {
    if (isTouchDevice) { mobileSpawn('box'); return; }
    setSpawnMode('box', 'spawn-box');
});
document.getElementById('spawn-pistol').addEventListener('click', () => {
    if (isTouchDevice) { mobileSpawn('pistol'); return; }
    setSpawnMode('pistol', 'spawn-pistol');
});
document.getElementById('spawn-syringe-adrenaline').addEventListener('click', () => {
    if (isTouchDevice) { mobileSpawn('syringe-adrenaline'); return; }
    setSpawnMode('syringe-adrenaline', 'spawn-syringe-adrenaline');
});


function createSyringe(x, y) {
    const syringeWidth = 8;
    const syringeLength = 30;
    
    const body = Bodies.rectangle(x, y, syringeWidth, syringeLength, {
        label: "syringe",
        render: { fillStyle: '#baddff' },
        friction: 0.5,
        density: 0.05
    });
    
    // Add a tiny needle visually (or as composite, but body is simpler for now)
    const needle = Bodies.rectangle(x, y - syringeLength/2 - 5, 2, 10, { 
        render: { fillStyle: '#ccc' }
    });
    
    const syringeComposite = Body.create({
        parts: [body, needle],
        label: "syringe",
        friction: 0.5,
        density: 0.05
    });
    
    Body.setPosition(syringeComposite, { x: x, y: y });
    Composite.add(world, syringeComposite);
    return syringeComposite;
}

// ---------- Tools Menu (Drag & Connect) Logic ----------
const toolBtns = document.querySelectorAll('.tool-btn');

let dragStartBody = null;
let dragStartPoint = null;

function setToolMode(mode, btnId) {
    if (toolMode === mode) {
        stopToolMode(); // properly cancel it and restore mouse constraint
        return;
    }
    toolMode = mode;
    toolBtns.forEach(b => b.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');
    
    // Clear spawn mode if picking a tool
    if (spawnMode) setSpawnMode(spawnMode, null);
    
    // Disable mouse interaction constraint while using tools so we don't accidentally throw objects
    mouseConstraint.collisionFilter.mask = 0; 
}

function stopToolMode() {
    toolMode = null;
    toolBtns.forEach(b => b.classList.remove('active'));
    // Restore mouse constraint
    mouseConstraint.collisionFilter.mask = 0xFFFFFFFF;
    dragStartBody = null;
    dragStartPoint = null;
}

// Tool Interaction Listeners
render.canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !toolMode) return; // Only left click for tools

    // Find the body we clicked on
    const bodies = Composite.allBodies(world);
    const clickedBodies = Query.point(bodies, currentMousePos);
    
    if (clickedBodies.length > 0) {
        // Start dragging from the top-most clicked body
        dragStartBody = clickedBodies[0];
        dragStartPoint = { x: currentMousePos.x, y: currentMousePos.y };
        
        // Compute local offset for exact attachment point
        dragStartBody.localClickOffset = {
            x: currentMousePos.x - dragStartBody.position.x,
            y: currentMousePos.y - dragStartBody.position.y
        };
    }
});

window.addEventListener('mouseup', (e) => {
    if (e.button !== 0 || !toolMode || !dragStartBody) return;

    const endPos = { x: e.clientX, y: e.clientY };
    const bodies = Composite.allBodies(world);
    const endBodies = Query.point(bodies, endPos);
    
    if (endBodies.length > 0) {
        const endBody = endBodies[0];
        
        // Prevent connecting a body to itself
        if (endBody !== dragStartBody) {
            
            // WIRE: Create a physical multi-segment rope
            if (toolMode === 'wire') {
                const startPoint = { 
                    x: dragStartBody.position.x + dragStartBody.localClickOffset.x, 
                    y: dragStartBody.position.y + dragStartBody.localClickOffset.y 
                };
                const endPoint = { 
                    x: endBody.position.x + (endPos.x - endBody.position.x), 
                    y: endBody.position.y + (endPos.y - endBody.position.y) 
                };
                
                const distance = Vector.magnitude(Vector.sub(endPoint, startPoint));
                const segmentLength = 15;
                const segmentsCount = Math.max(3, Math.floor(distance / segmentLength));
                
                // Create a collision group specifically for this rope so its segments don't collide with each other
                const ropeGroup = Body.nextGroup(true);
                
                // create the composite chain
                const ropeComposite = Matter.Composites.stack(startPoint.x, startPoint.y, segmentsCount, 1, 0, 0, function(x, y) {
                    return Bodies.rectangle(x, y, segmentLength, 4, { 
                        collisionFilter: { group: ropeGroup },
                        render: { fillStyle: '#44bb44' },
                        density: 0.05,
                        frictionAir: 0.05
                    });
                });
                
                Matter.Composites.chain(ropeComposite, 0.4, 0, -0.4, 0, { 
                    stiffness: 0.9, length: 1, render: { visible: false } 
                });
                
                // Anchor the first segment to the dragStartBody
                const firstSegment = ropeComposite.bodies[0];
                Composite.add(ropeComposite, Constraint.create({
                    bodyA: dragStartBody,
                    bodyB: firstSegment,
                    pointA: dragStartBody.localClickOffset,
                    pointB: { x: -segmentLength/2, y: 0 },
                    stiffness: 0.9,
                    render: { visible: false }
                }));

                // Anchor the last segment to the endBody
                const lastSegment = ropeComposite.bodies[ropeComposite.bodies.length - 1];
                Composite.add(ropeComposite, Constraint.create({
                    bodyA: endBody,
                    bodyB: lastSegment,
                    pointA: { x: endPos.x - endBody.position.x, y: endPos.y - endBody.position.y },
                    pointB: { x: segmentLength/2, y: 0 },
                    stiffness: 0.9,
                    render: { visible: false }
                }));

                Composite.add(world, ropeComposite);
                console.log("[Tools] Connected with physical rope.");
            }
            // BANDAGE: Heal and stop bleeding if attached to a ragdoll part
            else if (toolMode === 'bandage') {
                // If either end is a ragdoll part
                const r1 = dragStartBody.parentRagdoll;
                const r2 = endBody.parentRagdoll;
                
                if (r1 || r2) {
                    const r = r1 || r2;
                    if (r.isAlive && r.isBleeding) {
                        r.isBleeding = false;
                        console.log("[Medical] Applied bandage. Bleeding stopped.");
                        
                        // Visual patch (fixed square on top of the limb)
                        const targetPart = r1 ? dragStartBody : endBody;
                        const targetPos = r1 ? dragStartPoint : endPos;
                        
                        const bandagePatch = Bodies.rectangle(targetPos.x, targetPos.y, 10, 10, {
                            render: { fillStyle: '#eeeecc' },
                            collisionFilter: { group: -1, mask: 0 } // No collisions, visual only
                        });
                        
                        // Stick the patch to the body
                        const stick = Constraint.create({
                            bodyA: targetPart,
                            bodyB: bandagePatch,
                            pointA: { x: targetPos.x - targetPart.position.x, y: targetPos.y - targetPart.position.y },
                            stiffness: 1, length: 0,
                            render: { visible: false }
                        });
                        
                        Composite.add(world, [bandagePatch, stick]);
                    }
                }
            }
        }
    }
    
    dragStartBody = null;
    dragStartPoint = null;
});

// Render Tool Drag Line
Events.on(render, 'afterRender', function() {
    if (toolMode && dragStartBody) {
        const ctx = render.context;
        ctx.beginPath();
        const startX = dragStartBody.position.x + dragStartBody.localClickOffset.x;
        const startY = dragStartBody.position.y + dragStartBody.localClickOffset.y;
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentMousePos.x, currentMousePos.y);
        
        ctx.strokeStyle = toolMode === 'wire' ? '#44bb44' : '#eeeecc';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]); // Dashed line while drawing
        ctx.stroke();
        ctx.setLineDash([]); // Reset
    }
});


document.getElementById('tool-wire').addEventListener('click', () => setToolMode('wire', 'tool-wire'));
document.getElementById('tool-bandage').addEventListener('click', () => setToolMode('bandage', 'tool-bandage'));

// Right click cancels both tools and spawns
render.canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    spawnMode = null;
    spawnBtns.forEach(b => b.classList.remove('active'));
    stopToolMode();
});

// 6. Run Engine and Renderer
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Handle window resizing
window.addEventListener('resize', () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    render.options.width = window.innerWidth;
    render.options.height = window.innerHeight;
    Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + wallThickness / 2 - 20 });
    Matter.Body.setPosition(rightWall, { x: window.innerWidth + wallThickness / 2, y: window.innerHeight / 2 });
});

// ============================================================
// MOBILE TOUCH SUPPORT
// ============================================================
if (isTouchDevice) {
    const fireBtn   = document.getElementById('fire-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // ---- Fire button ----
    // Show when the player is holding a pistol via MouseConstraint
    setInterval(() => {
        if (mouseConstraint.body?.label === 'pistol') {
            fireBtn.classList.remove('hidden');
        } else {
            fireBtn.classList.add('hidden');
        }
    }, 150);

    fireBtn.addEventListener('click', () => {
        const pistol = mouseConstraint.body;
        if (pistol?.label === 'pistol') firePistol(pistol);
    });

    // ---- Cancel button (shows when a tool is active) ----
    // Patch tool buttons to show cancel btn
    document.getElementById('tool-wire').addEventListener('click',    () => cancelBtn.classList.toggle('hidden', !toolMode));
    document.getElementById('tool-bandage').addEventListener('click', () => cancelBtn.classList.toggle('hidden', !toolMode));

    cancelBtn.addEventListener('click', () => {
        stopToolMode();
        spawnMode = null;
        spawnBtns.forEach(b => b.classList.remove('active'));
        cancelBtn.classList.add('hidden');
    });

    // ---- Touch state ----
    let twoFingerActive   = false;
    let twoFingerAngle    = 0;
    let twoFingerBody     = null;
    let longPressTimer    = null;
    const LONG_PRESS_MS   = 600;
    // Pan/zoom state
    let lastTwoFingerDist = 0;
    let lastTwoFingerMidX = 0;
    let lastTwoFingerMidY = 0;

    function canvasPos(touch) {
        return { x: touch.clientX, y: touch.clientY };
    }

    // ---- touchstart ----
    render.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();

        // Two-finger: rotation (on body) OR pan+zoom (on empty space)
        if (e.touches.length >= 2) {
            clearTimeout(longPressTimer);
            twoFingerActive = true;

            const t1 = e.touches[0], t2 = e.touches[1];
            twoFingerAngle    = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
            lastTwoFingerDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            lastTwoFingerMidX = (t1.clientX + t2.clientX) / 2;
            lastTwoFingerMidY = (t1.clientY + t2.clientY) / 2;

            const dynBodies = Composite.allBodies(world).filter(b => !b.isStatic);
            twoFingerBody = Query.point(dynBodies, { x: lastTwoFingerMidX, y: lastTwoFingerMidY })[0]
                         || Query.point(dynBodies, { x: t1.clientX, y: t1.clientY })[0]
                         || Query.point(dynBodies, { x: t2.clientX, y: t2.clientY })[0]
                         || null;

            // Release Matter.js drag so it doesn't interfere
            render.canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: lastTwoFingerMidX, clientY: lastTwoFingerMidY }));
            return;
        }

        // Single touch
        const t   = e.touches[0];
        const pos = canvasPos(t);
        currentMousePos.x = pos.x;
        currentMousePos.y = pos.y;

        // Long-press → context menu (right-click equivalent)
        longPressTimer = setTimeout(() => {
            const clicked = Query.point(Composite.allBodies(world), pos);
            if (clicked.length > 0 && clicked[0].parentRagdoll) {
                selectedRagdoll = clicked[0].parentRagdoll;
                contextMenu.style.left = pos.x + 'px';
                contextMenu.style.top  = Math.max(0, pos.y - 60) + 'px';
                contextMenu.classList.remove('hidden');
            }
        }, LONG_PRESS_MS);

        // Tool mode: start drag (simulate mousedown on canvas)
        if (toolMode) {
            const clicked = Query.point(Composite.allBodies(world), pos);
            if (clicked.length > 0) {
                dragStartBody = clicked[0];
                dragStartPoint = { ...pos };
                dragStartBody.localClickOffset = {
                    x: pos.x - dragStartBody.position.x,
                    y: pos.y - dragStartBody.position.y
                };
            }
        }
        // (No-tool mode: Matter.js internal touch handler takes care of drag)

    }, { passive: false });

    // ---- touchmove ----
    render.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        clearTimeout(longPressTimer);

        // Two-finger: rotate body OR pan+zoom viewport
        if (twoFingerActive && e.touches.length >= 2) {
            const t1 = e.touches[0], t2 = e.touches[1];
            const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const newMidX = (t1.clientX + t2.clientX) / 2;
            const newMidY = (t1.clientY + t2.clientY) / 2;

            if (twoFingerBody && !twoFingerBody.isStatic) {
                // ── ROTATE ──
                const newAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
                const delta    = newAngle - twoFingerAngle;
                twoFingerAngle = newAngle;
                let target = twoFingerBody;
                if (target.parentRagdoll) target = target.parentRagdoll.torso;
                Body.setAngularVelocity(target, delta * 8);
            } else {
                // ── PAN + ZOOM viewport ──
                const viewW = render.bounds.max.x - render.bounds.min.x;
                const viewH = render.bounds.max.y - render.bounds.min.y;

                if (lastTwoFingerDist > 0) {
                    const zoomFactor = lastTwoFingerDist / newDist;
                    const ratioX = viewW / window.innerWidth;
                    const ratioY = viewH / window.innerHeight;
                    // World-space pinch centre
                    const wMidX = render.bounds.min.x + newMidX * ratioX;
                    const wMidY = render.bounds.min.y + newMidY * ratioY;
                    // New view size (clamped)
                    const newViewW = Math.min(Math.max(viewW * zoomFactor, window.innerWidth * 0.25), window.innerWidth * 6);
                    const newViewH = newViewW * (window.innerHeight / window.innerWidth);
                    render.bounds.min.x = wMidX - (newMidX / window.innerWidth) * newViewW;
                    render.bounds.max.x = render.bounds.min.x + newViewW;
                    render.bounds.min.y = wMidY - (newMidY / window.innerHeight) * newViewH;
                    render.bounds.max.y = render.bounds.min.y + newViewH;
                }

                // Pan: move bounds opposite to finger movement
                const curViewW = render.bounds.max.x - render.bounds.min.x;
                const curViewH = render.bounds.max.y - render.bounds.min.y;
                const panX = (lastTwoFingerMidX - newMidX) * (curViewW / window.innerWidth);
                const panY = (lastTwoFingerMidY - newMidY) * (curViewH / window.innerHeight);
                render.bounds.min.x += panX;  render.bounds.max.x += panX;
                render.bounds.min.y += panY;  render.bounds.max.y += panY;
            }

            lastTwoFingerDist = newDist;
            lastTwoFingerMidX = newMidX;
            lastTwoFingerMidY = newMidY;
            return;
        }

        if (!e.touches.length) return;
        const t   = e.touches[0];
        currentMousePos.x = t.clientX;
        currentMousePos.y = t.clientY;
        // Matter.js internal touchmove updates mouse.position automatically

    }, { passive: false });

    // ---- touchend ----
    render.canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        clearTimeout(longPressTimer);

        if (e.touches.length < 2 && twoFingerActive) {
            twoFingerActive = false;
            twoFingerBody   = null;
        }

        // Complete tool drag via synthetic mouseup (triggers existing mouseup handler)
        if (!twoFingerActive && toolMode && dragStartBody && e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            window.dispatchEvent(new MouseEvent('mouseup', {
                bubbles: true, cancelable: true,
                clientX: t.clientX, clientY: t.clientY,
                button: 0
            }));
        }

    }, { passive: false });
}
