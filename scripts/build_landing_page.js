const fs = require('fs');
const path = require('path');

const userPastedPath = path.join(__dirname, '..', 'landing-page', 'user_pasted.html');
const targetPath = path.join(__dirname, '..', 'landing-page', 'index.html');

let html = fs.readFileSync(userPastedPath, 'utf8');

// 1. Remove the WebGL Background canvas
html = html.replace(/<!-- WebGL Background Canvas -->[\s\S]*?<canvas[^>]*><\/canvas>/gi, '');
html = html.replace(/<canvas class="fixed inset-0 w-full h-full pointer-events-none -z-10" id="webgl-mesh-drift-bg"[^>]*><\/canvas>/gi, '');

// 2. Remove the WebGL script at the bottom
const scriptStartIdx = html.indexOf('<!-- WebGL Background Controller Script -->');
if (scriptStartIdx !== -1) {
  const bodyCloseIdx = html.indexOf('</body>', scriptStartIdx);
  if (bodyCloseIdx !== -1) {
    html = html.slice(0, scriptStartIdx) + html.slice(bodyCloseIdx);
  }
}

// 3. Update Hero Image: Remove card box / border and let 3D glowing DNA float seamlessly
// Match the right hero visual column
const heroImgBoxRegex = /<!-- Right Hero Visual Column \(DNA GENOBRIDGE Render\) -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/i;

const replacementHero = `<!-- Right Hero Visual Column (DNA GENOBRIDGE Render) -->
        <div class="lg:col-span-6 relative flex items-center justify-center lg:justify-end">
          <div class="relative w-full max-w-[580px] flex items-center justify-center">
            <!-- Subtle cyan backlight behind DNA -->
            <div class="absolute -inset-4 bg-gradient-to-r from-[#00D8C3]/20 via-[#22C9EE]/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <img 
              alt="Photorealistic glowing 3D DNA double-GENOBRIDGE genomics data visualization" 
              class="relative w-full h-auto object-contain [mask-image:radial-gradient(ellipse_at_center,black_65%,transparent_98%)] filter drop-shadow-[0_0_45px_rgba(0,216,195,0.35)] transform hover:scale-105 transition-transform duration-700 ease-out" 
              loading="eager" 
              src="images/dna-hero.png" 
              onerror="this.src='https://lh3.googleusercontent.com/aida/AEtjO1XIsVXsMJPd3xT-BmGOzr7tZ8u6tefaMtm4GJy9jBkpBpLtpqbuFh7kw-5-ZX4PnhrSeA5QTZpl7JlYuGTVP_vVCidwxpA45eBGjTpkWesIlVuh4vr1VnC124Cbldk3cgfwzqXXxdUMzZZdHt23dPbuUmRdLz6LC3fP-Jdufr07qheGCpuLU4uXvPHCb92fir_XTOcxRPelOh3HgWbd0vz-MB5O9SOifPl70prc-2A'"
            />
          </div>
        </div>
      </div>
    </div>
  </section>`;

html = html.replace(heroImgBoxRegex, replacementHero);

// 4. Update clinician tablet image with local fallback
html = html.replace(
  'src="https://lh3.googleusercontent.com/aida/AEtjO1WtkujeqSa_Zk9KiocRWNxiio2VMil5d21fgPzzwImlE0VXc_A9jtT57YtzxGELDWvMR3LgFnPXwuA_N6Nb7shOUlTmTqdzCNRNON39C2o6y8r9itu_YETS1ddoC5-SnElSO0VCXGYu00GwIAZ3yJL0WBOjBhP1Tlf3sZ0yrFbHgLvvLKJtIIoWfngMIGj1aIdC3FpNHVhIptElAJyxui7CctmeHd1PsG5vkNYRP8GB"',
  'src="images/clinician-tablet.png" onerror="this.src=\'https://lh3.googleusercontent.com/aida/AEtjO1WtkujeqSa_Zk9KiocRWNxiio2VMil5d21fgPzzwImlE0VXc_A9jtT57YtzxGELDWvMR3LgFnPXwuA_N6Nb7shOUlTmTqdzCNRNON39C2o6y8r9itu_YETS1ddoC5-SnElSO0VCXGYu00GwIAZ3yJL0WBOjBhP1Tlf3sZ0yrFbHgLvvLKJtIIoWfngMIGj1aIdC3FpNHVhIptElAJyxui7CctmeHd1PsG5vkNYRP8GB\'"'
);

// 5. Update CTA background image with local fallback
html = html.replace(
  'src="https://lh3.googleusercontent.com/aida/AEtjO1XIsVXsMJPd3xT-BmGOzr7tZ8u6tefaMtm4GJy9jBkpBpLtpqbuFh7kw-5-ZX4PnhrSeA5QTZpl7JlYuGTVP_vVCidwxpA45eBGjTpkWesIlVuh4vr1VnC124Cbldk3cgfwzqXXxdUMzZZdHt23dPbuUmRdLz6LC3fP-Jdufr07qheGCpuLU4uXvPHCb92fir_XTOcxRPelOh3HgWbd0vz-MB5O9SOifPl70prc-2A"',
  'src="images/dna-hero.png" onerror="this.src=\'https://lh3.googleusercontent.com/aida/AEtjO1XIsVXsMJPd3xT-BmGOzr7tZ8u6tefaMtm4GJy9jBkpBpLtpqbuFh7kw-5-ZX4PnhrSeA5QTZpl7JlYuGTVP_vVCidwxpA45eBGjTpkWesIlVuh4vr1VnC124Cbldk3cgfwzqXXxdUMzZZdHt23dPbuUmRdLz6LC3fP-Jdufr07qheGCpuLU4uXvPHCb92fir_XTOcxRPelOh3HgWbd0vz-MB5O9SOifPl70prc-2A\'"'
);

// 6. Ensure IDs on sections for header and CTA links
if (!html.includes('id="the-challenge"')) {
  html = html.replace('data-purpose="the-challenge"', 'data-purpose="the-challenge" id="the-challenge"');
}
if (!html.includes('id="platform"')) {
  html = html.replace('data-purpose="hero-container"', 'data-purpose="hero-container" id="platform"');
}

// 7. Add an ambient 2D particle canvas that renders soft glowing cyan nodes & connecting lines
// This adds life while strictly adhering to the dark obsidian navy and cyan palette (#031525 & #00D8C3).
const ambientScript = `
<!-- Ambient Genomics Particle Canvas (Bioluminescent Cyan & Obsidian Only) -->
<canvas id="genomics-ambient-canvas" class="fixed inset-0 w-full h-full pointer-events-none -z-10" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 0;"></canvas>

<script>
(function() {
  const canvas = document.getElementById('genomics-ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0, height = 0;
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  const numNodes = Math.min(Math.floor(window.innerWidth / 40), 40);
  const nodes = [];
  for (let i = 0; i < numNodes; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.3 + 0.15
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw connecting lines
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0, 216, 195, ' + ((1 - dist / 120) * 0.08) + ')';
          ctx.lineWidth = 0.8;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0) n.x = width;
      if (n.x > width) n.x = 0;
      if (n.y < 0) n.y = height;
      if (n.y > height) n.y = 0;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 216, 195, ' + n.alpha + ')';
      ctx.shadowColor = '#00D8C3';
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
</script>
`;

html = html.replace('</body>', ambientScript + '\n</body>');

// 8. Clean up any trailing text after </html>
const htmlCloseIdx = html.indexOf('</html>');
if (htmlCloseIdx !== -1) {
  html = html.slice(0, htmlCloseIdx + 7) + '\n';
}

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully wrote index.html, size:', html.length);

