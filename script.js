gsap.registerPlugin(ScrollTrigger);

// ---- 3D DNA Particle Environmental Setup ----
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0); 
container.appendChild(renderer.domElement);
scene.fog = new THREE.FogExp2(0xFFFFFF, 0.05);

const dnaGroup = new THREE.Group();
const particleCount = 15000;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleOriginalPositions = new Float32Array(particleCount * 3);
const particleVelocities = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);

const height = 40;
const radius = 2.5;
const twist = Math.PI * 10;
const colorGold = new THREE.Color(0x0ea5e9);
const colorYellow = new THREE.Color(0x38bdf8);

let pIndex = 0;

function addParticle(x, y, z) {
    particlePositions[pIndex * 3] = x;
    particlePositions[pIndex * 3 + 1] = y;
    particlePositions[pIndex * 3 + 2] = z;
    particleOriginalPositions[pIndex * 3] = x;
    particleOriginalPositions[pIndex * 3 + 1] = y;
    particleOriginalPositions[pIndex * 3 + 2] = z;
    particleVelocities[pIndex * 3] = 0;
    particleVelocities[pIndex * 3 + 1] = 0;
    particleVelocities[pIndex * 3 + 2] = 0;
    
    let mixedColor = colorGold.clone().lerp(colorYellow, Math.random());
    particleColors[pIndex * 3] = mixedColor.r;
    particleColors[pIndex * 3 + 1] = mixedColor.g;
    particleColors[pIndex * 3 + 2] = mixedColor.b;
    pIndex++;
}

// 1. Double Backbone (Solid Spirals)
const backboneParticles = 7000;
for(let j = 0; j < backboneParticles; j++) {
    let t = Math.random(); 
    let y = (t - 0.5) * height;
    let angle = t * twist;
    let strandId = Math.random() > 0.5 ? 0 : Math.PI;
    let rDistortion = radius + (Math.random() - 0.5) * 0.4;
    
    let x = Math.cos(angle + strandId) * rDistortion;
    let z = Math.sin(angle + strandId) * rDistortion;
    addParticle(x, y, z);
}

// 2. Clear Connector Rungs (Ladders)
const numRungs = 50; 
const connectorParticles = 6000;
const particlesPerRung = connectorParticles / numRungs;
for(let r = 0; r < numRungs; r++) {
    let t = r / (numRungs - 1);
    let y = (t - 0.5) * height;
    let angle = t * twist;
    
    let x1 = Math.cos(angle) * radius;
    let z1 = Math.sin(angle) * radius;
    let x2 = Math.cos(angle + Math.PI) * radius;
    let z2 = Math.sin(angle + Math.PI) * radius;
    
    for(let k = 0; k < particlesPerRung; k++) {
        let connectT = Math.random(); 
        let px = x1 + (x2 - x1) * connectT;
        let pz = z1 + (z2 - z1) * connectT;
        
        px += (Math.random() - 0.5) * 0.2;
        let py = y + (Math.random() - 0.5) * 0.2;
        pz += (Math.random() - 0.5) * 0.2;
        
        addParticle(px, py, pz);
    }
}

// 3. Ambient Fluid Particles
const ambientParticles = particleCount - pIndex;
for(let j = 0; j < ambientParticles; j++) {
    let px = (Math.random() - 0.5) * 20;
    let py = (Math.random() - 0.5) * 50;
    let pz = (Math.random() - 0.5) * 20;
    addParticle(px, py, pz);
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

const createDotTexture = () => {
    let canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    let ctx = canvas.getContext('2d');
    let gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
};

const particleMaterial = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.NormalBlending,
    map: createDotTexture(),
    depthWrite: false
});

const particleSystem3D = new THREE.Points(particleGeometry, particleMaterial);
dnaGroup.add(particleSystem3D);
dnaGroup.rotation.z = 0.2;
dnaGroup.rotation.x = 0.2;
scene.add(dnaGroup);
camera.position.z = 12;

const mouse = new THREE.Vector2(-1000, -1000);
const mouse3D = new THREE.Vector3(0, 0, 0);
const raycaster = new THREE.Raycaster();
const invisiblePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); 
let pointerIsActive = false;

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    pointerIsActive = true;
});

window.addEventListener('mouseout', () => { pointerIsActive = false; });

const clock = new THREE.Clock();
function animate3D() {
    requestAnimationFrame(animate3D);
    const elapsedTime = clock.getElapsedTime();

    dnaGroup.rotation.y -= 0.003;
    dnaGroup.position.x += Math.sin(elapsedTime * 1.5) * 0.005;

    if (pointerIsActive) {
        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(invisiblePlane, mouse3D);
        dnaGroup.worldToLocal(mouse3D);
    } else {
        mouse3D.set(-1000, -1000, -1000);
    }

    const positions = particleSystem3D.geometry.attributes.position.array;
    const forceRadius = 5.0;
    const returnSpeed = 0.03;

    for (let i = 0; i < particleCount; i++) {
        let ix = i * 3;
        let iy = i * 3 + 1;
        let iz = i * 3 + 2;

        let ox = particleOriginalPositions[ix];
        let oy = particleOriginalPositions[iy];
        let oz = particleOriginalPositions[iz];

        let px = positions[ix];
        let py = positions[iy];
        let pz = positions[iz];

        let dx = px - mouse3D.x;
        let dy = py - mouse3D.y;
        let dz = pz - mouse3D.z;

        let distSq = dx*dx + dy*dy + dz*dz;
        
        let vx = particleVelocities[ix];
        let vy = particleVelocities[iy];
        let vz = particleVelocities[iz];

        if (pointerIsActive && distSq < forceRadius * forceRadius) {
            let dist = Math.sqrt(distSq);
            let force = (forceRadius - dist) / forceRadius;
            vx += (dx / dist) * force * 0.04 - (dz / dist) * force * 0.02;
            vy += (dy / dist) * force * 0.04;
            vz += (dz / dist) * force * 0.04 + (dx / dist) * force * 0.02;
        }

        let wave = Math.sin(oy * 1.5 + elapsedTime * 2) * 0.15;
        let pulseX = Math.cos(oy + elapsedTime) * 0.05;
        let pulseZ = Math.sin(oy + elapsedTime) * 0.05;

        let tx = ox + pulseX;
        let ty = oy + wave;
        let tz = oz + pulseZ;

        vx += (tx - px) * returnSpeed;
        vy += (ty - py) * returnSpeed;
        vz += (tz - pz) * returnSpeed;

        vx *= 0.88;
        vy *= 0.88;
        vz *= 0.88;

        particleVelocities[ix] = vx;
        particleVelocities[iy] = vy;
        particleVelocities[iz] = vz;

        positions[ix] = px + vx;
        positions[iy] = py + vy;
        positions[iz] = pz + vz;
    }
    
    particleSystem3D.geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
}
animate3D();


// ---- GSAP Scroll Animations ----
gsap.to(dnaGroup.rotation, {
    y: Math.PI * 4,
    x: Math.PI / 4,
    scrollTrigger: {
        trigger: ".scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5
    }
});

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5
    }
});

tl.to(dnaGroup.position, { 
    x: -4,
    y: -3,
    z: -5,
    ease: "power1.inOut"
})
.to(dnaGroup.position, { 
    x: 5,
    y: 2,
    z: 2,
    ease: "power1.inOut"
})
.to(dnaGroup.position, { 
    x: 0,
    y: 0,
    z: 6,
    ease: "power1.inOut"
});

gsap.from(".hero .line", {
    y: 100,
    opacity: 0,
    duration: 1.5,
    stagger: 0.2,
    ease: "power4.out",
    delay: 0.2
});

gsap.from(".hero .subtitle, .scroll-indicator", {
    y: 20,
    opacity: 0,
    duration: 1,
    ease: "power2.out",
    delay: 1
});

const fadeElements = document.querySelectorAll('.fade-text');
fadeElements.forEach(el => {
    gsap.fromTo(el, {
        y: 40,
        opacity: 0
    }, {
        y: 0,
        opacity: 1,
        duration: 2,
        ease: "power3.out",
        scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "bottom 50%",
            toggleActions: "play none none reverse"
        }
    });
});

gsap.from('.card', {
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: "power3.out",
    clearProps: "all",
    scrollTrigger: {
        trigger: '.glass-cards',
        start: "top 80%"
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- Interactive Behaviours & Logic ----
const menuOpenBtn = document.getElementById('menu-open');
const menuCloseBtn = document.getElementById('menu-close');
const overlayMenu = document.getElementById('overlay-menu');
const menuLinks = document.querySelectorAll('.menu-links a');

menuOpenBtn.addEventListener('click', () => {
    overlayMenu.classList.add('open');
});

const closeMenu = () => {
    overlayMenu.classList.remove('open');
};

menuCloseBtn.addEventListener('click', closeMenu);

// Overlay Binding Logic
function bindOverlay(linkId, overlayId, closeBtnClass, backBtnClass) {
    const link = document.getElementById(linkId);
    if (!link) return;
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;
    
    const closeBtns = overlay.querySelectorAll('.' + closeBtnClass);
    const backBtns = overlay.querySelectorAll('.' + backBtnClass);

    link.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        overlay.classList.add('open');
    });

    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        overlay.classList.remove('open');
    }));

    backBtns.forEach(btn => btn.addEventListener('click', () => {
        overlay.classList.remove('open');
        overlayMenu.classList.add('open');
    }));
}

// Bind the links to their modals
bindOverlay('link-nosotros', 'overlay-nosotros', 'nosotros-close', 'nosotros-back');
bindOverlay('link-certificados', 'overlay-certificados', 'btn-close-certificados', 'btn-back-certificados');
bindOverlay('link-ayuda', 'overlay-ayuda', 'btn-close-ayuda', 'btn-back-ayuda');
bindOverlay('link-cursos', 'overlay-cursos', 'btn-close-cursos', 'btn-back-cursos');

// Certificados to Buscar Certificados logic
const btnOpenBuscar = document.getElementById('btn-open-buscar');
const overlayBuscar = document.getElementById('overlay-buscar-certificado');
const overlayCertificados = document.getElementById('overlay-certificados');

if(btnOpenBuscar && overlayBuscar && overlayCertificados) {
    btnOpenBuscar.addEventListener('click', () => {
        overlayCertificados.classList.remove('open');
        overlayBuscar.classList.add('open');
    });

    overlayBuscar.querySelector('.btn-close-buscar-cert').addEventListener('click', () => {
        overlayBuscar.classList.remove('open');
    });

    overlayBuscar.querySelector('.btn-back-buscar-cert').addEventListener('click', () => {
        overlayBuscar.classList.remove('open');
        overlayCertificados.classList.add('open');
    });
}

const certForm = document.getElementById("cert-form");
if (certForm) {
    certForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const cedula = document.getElementById("cedula").value.trim();
        const resultado = document.getElementById("resultado");
        
        if (!cedula) {
            resultado.innerHTML = "⚠️ Por favor, ingrese una cédula o pasaporte válido.";
            resultado.style.display = "block";
            return;
        }

        resultado.innerHTML = "🔍 Buscando en nuestra base de datos...";
        resultado.style.display = "block";

        const scriptUrl = 'https://script.google.com/macros/s/AKfycbyZjdbzOpAPjYrhM_HPuo_GCJNFJKGNK5xeBMyHAJunwH0hFGG7FBJlnATywcZGhnVU6g/exec';
        
        fetch(`${scriptUrl}?cedula=${cedula}`)
            .then(response => response.json())
            .then(data => {
                if(data.encontrado) {
                    let fechaFormateada = data.fecha;
                    try {
                        const dateObj = new Date(data.fecha);
                        if (!isNaN(dateObj.getTime())) {
                            // Adjust for timezone offset to prevent showing the previous day
                            const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
                            const adjustedDate = new Date(dateObj.getTime() + userTimezoneOffset);
                            fechaFormateada = adjustedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                        }
                    } catch(e) {}
                    
                    resultado.innerHTML = `
                        <p><strong style="color:var(--gold);">Nombre:</strong> ${data.nombre}</p>
                        <p><strong style="color:var(--gold);">Curso:</strong> ${data.curso}</p>
                        <p><strong style="color:var(--gold);">Fecha de expedición:</strong> ${fechaFormateada}</p>
                        <p style="color: #10b981; margin-top: 10px;">✅ Certificado Aprobado y Validado.</p>
                        <a href="${data.link}" target="_blank" class="card-btn btn-green" style="display:inline-block; margin-top:20px; padding:10px 20px; text-decoration:none; text-align:center;">DESCARGAR CERTIFICADO (PDF)</a>
                    `;
                } else {
                    resultado.innerHTML = "❌ No se encontró ningún certificado emitido para esta identificación. Si crees que es un error, por favor contacta a soporte.";
                }
            })
            .catch(error => {
                console.error('Error fetching certificate:', error);
                resultado.innerHTML = "⚠️ Hubo un error de conexión al buscar tu certificado. Por favor, inténtalo más tarde.";
            });
    });
}

// Terminos and Privacidad Overlay Logic
const overlayTerminos = document.getElementById('overlay-terminos');
const overlayPrivacidad = document.getElementById('overlay-privacidad');

document.querySelectorAll('.link-terminos').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        if(overlayTerminos) overlayTerminos.classList.add('open');
    });
});
if(overlayTerminos) {
    overlayTerminos.querySelectorAll('.btn-close-terminos').forEach(btn => {
        btn.addEventListener('click', () => overlayTerminos.classList.remove('open'));
    });
}

document.querySelectorAll('.link-privacidad').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        if(overlayPrivacidad) overlayPrivacidad.classList.add('open');
    });
});
if(overlayPrivacidad) {
    overlayPrivacidad.querySelectorAll('.btn-close-privacidad').forEach(btn => {
        btn.addEventListener('click', () => overlayPrivacidad.classList.remove('open'));
    });
}

// Menu links jump scroll
menuLinks.forEach(link => {
    if (!link.id || !link.id.startsWith('link-')) {
        link.addEventListener('click', closeMenu);
    }
});

// FAQ Accordion logic
const accordions = document.querySelectorAll('.accordion-item');
accordions.forEach(acc => {
    const btn = acc.querySelector('.accordion-header');
    btn.addEventListener('click', () => {
        const isActive = acc.classList.contains('active');
        accordions.forEach(a => a.classList.remove('active'));
        if (!isActive) acc.classList.add('active');
    });
});

// ---- Vertical Navigation & Background Dynamics ----
const sections = document.querySelectorAll('.panel');
const navDots = document.querySelectorAll('.nav-dot');

sections.forEach((sec, i) => {
    ScrollTrigger.create({
        trigger: sec,
        start: "top center",
        end: "bottom center",
        onToggle: self => {
            if (self.isActive && navDots[i]) {
                navDots.forEach(dot => dot.classList.remove('active'));
                navDots[i].classList.add('active');
            }
        }
    });
});

navDots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
        sections[i].scrollIntoView({ behavior: 'smooth' });
    });
});

// ---- WhatsApp Alternating Logic ----
let lastContactIndex = 0;
function openWhatsAppContact() {
    const numbers = ['593978804190', '593963146787'];
    const selectedNumber = numbers[lastContactIndex];
    lastContactIndex = (lastContactIndex + 1) % numbers.length;
    
    const message = "Hola BioLearnX👋 me gustaría conocer sobre sus cursos, 😃 mi nombre es:";
    const url = `https://wa.me/${selectedNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// ---- Copy Email Logic ----
function copyEmail(btnElement) {
    const email = "biolearnx@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
        const originalText = btnElement.innerText;
        btnElement.innerText = "¡Correo copiado!";
        btnElement.style.backgroundColor = "#198754"; // Darker green for feedback
        btnElement.style.color = "white";
        
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.style.backgroundColor = ""; 
            btnElement.style.color = "";
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// ---- Course WhatsApp Logic ----
function openCourseWhatsApp(courseName) {
    const numbers = ['593978804190', '593963146787'];
    const selectedNumber = numbers[lastContactIndex];
    lastContactIndex = (lastContactIndex + 1) % numbers.length;
    
    const message = `Hola BioLearnX👋 me gustaría conocer sobre el curso: *${courseName}*, 😃 mi nombre es:`;
    const url = `https://wa.me/${selectedNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// ---- Certificates WhatsApp Logic ----
function openCertHelpWhatsApp() {
    const numbers = ['593978804190', '593963146787'];
    const selectedNumber = numbers[lastContactIndex];
    lastContactIndex = (lastContactIndex + 1) % numbers.length;
    
    const message = "Hola BioLearnX👋, necesito ayuda con mi certificado, 😃 mi nombre es:";
    const url = `https://wa.me/${selectedNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// ---- Bear.IO WhatsApp Logic ----
function openBearWhatsApp() {
    const message = "Hola Bear.IO👋, vi el logotipo en uno de tus trabajos web, 😃mi nombre es:";
    const url = `https://wa.me/593978804190?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}
