class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.scoreElement = document.getElementById('scoreValue');
        
        // 枪的位置
        this.gun = {
            x: 50,
            y: this.canvas.height / 2,
            angle: 0
        };
        
        // 子弹数组
        this.bullets = [];
        
        // 鲨鱼数组
        this.sharks = [];
        
        // 添加气泡数组
        this.bubbles = [];
        
        // 添加死亡鲨鱼数组
        this.deadSharks = [];
        
        // 添加音效
        // this.shootSound = document.getElementById('shootSound');
        // this.hitSound = document.getElementById('hitSound');
        
        // 添加文字提示数组
        this.textEffects = [];
        
        // 绑定事件
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        
        // 开始游戏循环
        setInterval(this.gameLoop.bind(this), 1000/60);
        
        // 定期生成鲨鱼
        setInterval(this.generateSeaCreature.bind(this), 1500);
        
        // 添加呼吸计时器
        setInterval(() => {
            this.sharks.forEach(shark => {
                this.generateBubbles(shark);
            });
        }, 1000);
        
        // 定义海洋生物类型
        this.seaCreatures = [
            {
                type: 'shark',
                color: '#2C3E50',
                finColor: '#34495E',
                size: 40,
                speed: 2,
                points: 10,
                probability: 0.4
            },
            {
                type: 'greatWhite',
                color: '#7F8C8D',
                finColor: '#95A5A6',
                size: 60,
                speed: 1.5,
                points: 20,
                probability: 0.2
            },
            {
                type: 'fish',
                color: '#E74C3C',
                finColor: '#C0392B',
                size: 25,
                speed: 3,
                points: 15,
                probability: 0.4
            }
        ];
        
        // 添加游戏等级系统
        this.level = 1;
        this.levelElement = document.createElement('div');
        this.levelElement.id = 'level';
        this.levelElement.style.fontSize = '24px';
        this.levelElement.style.marginBottom = '10px';
        document.querySelector('#gameContainer').insertBefore(this.levelElement, this.canvas);
        this.updateLevelDisplay();
        
        // 武器系统
        this.weapons = {
            pistol: {
                name: '手枪',
                damage: 1,
                speed: 10,
                size: 5,
                color: '#FF0000',
                fireRate: 500,
                unlockScore: 0,
                effect: 'normal',
                sound: {
                    shoot: 'https://assets.mixkit.co/active_storage/sfx/2771/2771-preview.mp3',
                    hit: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
                }
            },
            shotgun: {
                name: '霰弹枪',
                damage: 0.7,
                speed: 8,
                size: 3,
                color: '#FFA500',
                fireRate: 1000,
                bulletCount: 5,
                spread: 0.3,
                unlockScore: 100,
                effect: 'spread',
                sound: {
                    shoot: 'https://assets.mixkit.co/active_storage/sfx/623/623-preview.mp3',
                    hit: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
                }
            },
            laser: {
                name: '激光枪',
                damage: 1.5,
                speed: 15,
                size: 4,
                color: '#00FF00',
                fireRate: 300,
                unlockScore: 300,
                effect: 'laser',
                sound: {
                    shoot: 'https://assets.mixkit.co/active_storage/sfx/1667/1667-preview.mp3',
                    hit: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
                }
            }
        };
        
        // 添加武器特效数组
        this.weaponEffects = [];
        
        // 为每种武器创建音效对象
        this.weaponSounds = {};
        Object.keys(this.weapons).forEach(weaponType => {
            this.weaponSounds[weaponType] = {
                shoot: new Audio(this.weapons[weaponType].sound.shoot),
                hit: new Audio(this.weapons[weaponType].sound.hit)
            };
            // 设置音量
            this.weaponSounds[weaponType].shoot.volume = 0.3;
            this.weaponSounds[weaponType].hit.volume = 0.3;
        });
        
        // 当前武器
        this.currentWeapon = 'pistol';
        this.lastShotTime = 0;
        
        // 添加武器选择UI
        this.createWeaponUI();
        
        // 添加等级提升的难度参数
        this.levelParams = {
            spawnRate: 1500,    // 生物生成间隔
            speedMultiplier: 1  // 速度倍数
        };
    }
    
    createWeaponUI() {
        const weaponContainer = document.createElement('div');
        weaponContainer.style.marginBottom = '10px';
        
        Object.keys(this.weapons).forEach(weaponType => {
            const weapon = this.weapons[weaponType];
            const button = document.createElement('button');
            button.textContent = weapon.name;
            button.style.margin = '0 10px';
            button.style.padding = '5px 10px';
            button.style.cursor = 'pointer';
            
            button.addEventListener('click', () => {
                if (this.score >= weapon.unlockScore) {
                    this.currentWeapon = weaponType;
                    this.updateWeaponUI();
                }
            });
            
            weaponContainer.appendChild(button);
            weapon.button = button;  // 保存按钮引用以便更新
        });
        
        document.querySelector('#gameContainer').insertBefore(weaponContainer, this.canvas);
        this.updateWeaponUI();
    }
    
    updateWeaponUI() {
        Object.keys(this.weapons).forEach(weaponType => {
            const weapon = this.weapons[weaponType];
            const button = weapon.button;
            
            if (this.score < weapon.unlockScore) {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.textContent = `${weapon.name} (需要 ${weapon.unlockScore} 分)`;
            } else {
                button.disabled = false;
                button.style.opacity = '1';
                button.textContent = weapon.name;
            }
            
            if (weaponType === this.currentWeapon) {
                button.style.backgroundColor = '#4CAF50';
                button.style.color = 'white';
            } else {
                button.style.backgroundColor = '';
                button.style.color = '';
            }
        });
    }
    
    updateLevelDisplay() {
        this.levelElement.textContent = `等级: ${this.level}`;
    }
    
    checkLevelUp() {
        const newLevel = Math.floor(this.score / 100) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.updateLevelDisplay();
            this.increaseDifficulty();
        }
    }
    
    increaseDifficulty() {
        // 提高难度
        this.levelParams.spawnRate = Math.max(500, 1500 - (this.level - 1) * 100);
        this.levelParams.speedMultiplier = 1 + (this.level - 1) * 0.1;
        
        // 更新生成间隔
        clearInterval(this.spawnInterval);
        this.spawnInterval = setInterval(this.generateSeaCreature.bind(this), this.levelParams.spawnRate);
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // 计算枪的角度
        this.gun.angle = Math.atan2(mouseY - this.gun.y, mouseX - this.gun.x);
    }
    
    handleClick() {
        const currentTime = Date.now();
        const weapon = this.weapons[this.currentWeapon];
        
        if (currentTime - this.lastShotTime >= weapon.fireRate) {
            // 播放当前武器的射击音效
            this.weaponSounds[this.currentWeapon].shoot.currentTime = 0;
            this.weaponSounds[this.currentWeapon].shoot.play();

            if (this.currentWeapon === 'shotgun') {
                // 霰弹枪效果
                for (let i = 0; i < weapon.bulletCount; i++) {
                    const spreadAngle = (Math.random() - 0.5) * weapon.spread;
                    this.bullets.push({
                        x: this.gun.x,
                        y: this.gun.y,
                        speed: weapon.speed,
                        angle: this.gun.angle + spreadAngle,
                        damage: weapon.damage,
                        size: weapon.size,
                        color: weapon.color,
                        effect: weapon.effect
                    });
                }
                // 添加霰弹枪特效
                this.addWeaponEffect('spread', this.gun.x, this.gun.y, this.gun.angle);
            } else {
                // 其他武器效果
                this.bullets.push({
                    x: this.gun.x,
                    y: this.gun.y,
                    speed: weapon.speed,
                    angle: this.gun.angle,
                    damage: weapon.damage,
                    size: weapon.size,
                    color: weapon.color,
                    effect: weapon.effect
                });
                // 添加对应武器特效
                this.addWeaponEffect(weapon.effect, this.gun.x, this.gun.y, this.gun.angle);
            }
            
            this.lastShotTime = currentTime;
        }
    }
    
    addWeaponEffect(type, x, y, angle) {
        switch(type) {
            case 'normal':
                // 普通枪口闪光效果
                this.weaponEffects.push({
                    type: 'flash',
                    x: x + Math.cos(angle) * 60,
                    y: y + Math.sin(angle) * 60,
                    size: 20,
                    opacity: 1,
                    angle: angle
                });
                break;
            case 'spread':
                // 霰弹枪扩散效果
                for (let i = 0; i < 8; i++) {
                    const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
                    this.weaponEffects.push({
                        type: 'particle',
                        x: x + Math.cos(angle) * 60,
                        y: y + Math.sin(angle) * 60,
                        size: 5,
                        speed: Math.random() * 5 + 2,
                        angle: spreadAngle,
                        opacity: 1,
                        color: '#FFA500'
                    });
                }
                break;
            case 'laser':
                // 激光效果
                this.weaponEffects.push({
                    type: 'laser',
                    x: x,
                    y: y,
                    length: 0,
                    maxLength: 100,
                    width: 8,
                    opacity: 0.8,
                    angle: angle,
                    color: '#00FF00'
                });
                break;
        }
    }
    
    generateSeaCreature() {
        // 根据概率随机选择生物类型
        const random = Math.random();
        let probabilitySum = 0;
        let selectedCreature;
        
        for (const creature of this.seaCreatures) {
            probabilitySum += creature.probability;
            if (random <= probabilitySum) {
                selectedCreature = creature;
                break;
            }
        }
        
        // 生成选中的海洋生物
        const newCreature = {
            x: this.canvas.width + 40,
            y: Math.random() * (this.canvas.height - 100) + 50,
            type: selectedCreature.type,
            color: selectedCreature.color,
            finColor: selectedCreature.finColor,
            size: selectedCreature.size,
            points: selectedCreature.points,
            speed: selectedCreature.speed + Math.random(),
            breatheOffset: 0,
            breatheDirection: 1,
            horizontalSpeed: -(selectedCreature.speed + Math.random())
        };
        
        // 生成气泡的方法也需要这个生物的信息
        this.generateBubbles(newCreature);
        
        // 将新生物添加到数组中
        this.sharks.push(newCreature);
    }
    
    generateBubbles(shark) {
        // 生成气泡
        for (let i = 0; i < 3; i++) {
            this.bubbles.push({
                x: shark.x,
                y: shark.y - shark.size/2,
                size: 3 + Math.random() * 5,
                speed: 1 + Math.random() * 2,
                opacity: 1
            });
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
    }
    
    update() {
        // 更新子弹位置
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;
            return bullet.x >= 0 && bullet.x <= this.canvas.width &&
                   bullet.y >= 0 && bullet.y <= this.canvas.height;
        });
        
        // 更新鲨鱼位置
        this.sharks = this.sharks.filter(shark => {
            shark.x += shark.horizontalSpeed;
            
            // 检测子弹碰撞
            for (let i = 0; i < this.bullets.length; i++) {
                const bullet = this.bullets[i];
                const dx = bullet.x - shark.x;
                const dy = bullet.y - shark.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < shark.size) {
                    // 移除子弹
                    this.bullets.splice(i, 1);
                    // 添加分数
                    this.score += shark.points;  // 使用生物特定的分数
                    this.scoreElement.textContent = this.score;
                    // 添加死亡鲨鱼
                    this.addDeadShark(shark);
                    
                    // 播放当前武器的击中音效
                    this.weaponSounds[this.currentWeapon].hit.currentTime = 0;
                    this.weaponSounds[this.currentWeapon].hit.play();
                    
                    // 添加文字效果
                    this.addTextEffect(shark.x, shark.y - 50, `+${shark.points}!`);
                    // 返回false以从sharks数组中移除该鲨鱼
                    return false;
                }
            }
            
            return shark.x > -shark.size;
        });
        
        // 更新死亡鲨鱼
        this.deadSharks = this.deadSharks.filter(shark => {
            shark.rotation += 0.1;
            shark.y += shark.fallSpeed;
            shark.fallSpeed += 0.2;
            shark.opacity -= 0.02;
            return shark.opacity > 0;
        });
        
        // 更新气泡
        this.bubbles = this.bubbles.filter(bubble => {
            bubble.y -= bubble.speed;
            bubble.opacity -= 0.02;
            return bubble.opacity > 0;
        });
        
        // 更新鲨鱼呼吸动画
        this.sharks.forEach(shark => {
            shark.breatheOffset += 0.1 * shark.breatheDirection;
            if (Math.abs(shark.breatheOffset) > 3) {
                shark.breatheDirection *= -1;
            }
        });
        
        // 更新文字效果
        this.textEffects = this.textEffects.filter(effect => {
            effect.y -= 1;  // 向上飘动
            effect.opacity -= 0.02;  // 渐渐消失
            effect.scale += 0.02;    // 缓慢放大
            effect.life--;
            return effect.life > 0;
        });
        
        // 在更新分数后检查等级
        this.checkLevelUp();
        this.updateWeaponUI();
        
        // 更新武器特效
        this.weaponEffects = this.weaponEffects.filter(effect => {
            switch(effect.type) {
                case 'flash':
                    effect.opacity -= 0.1;
                    return effect.opacity > 0;
                case 'particle':
                    effect.x += Math.cos(effect.angle) * effect.speed;
                    effect.y += Math.sin(effect.angle) * effect.speed;
                    effect.opacity -= 0.05;
                    return effect.opacity > 0;
                case 'laser':
                    effect.length += 20;
                    effect.opacity -= 0.1;
                    return effect.opacity > 0;
            }
        });
    }
    
    addDeadShark(shark) {
        this.deadSharks.push({
            x: shark.x,
            y: shark.y,
            size: shark.size,
            type: shark.type,  // 添加类型信息
            color: shark.color,  // 添加颜色信息
            finColor: shark.finColor,  // 添加鳍的颜色信息
            rotation: 0,
            fallSpeed: -5,
            opacity: 1
        });
    }
    
    addTextEffect(x, y, text) {
        this.textEffects.push({
            text: text,
            x: x,
            y: y,
            opacity: 1,
            scale: 1,
            life: 60
        });
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制瞄准线
        this.drawCrosshair();
        
        // 绘制枪
        this.drawGun();
        
        // 绘制子弹
        this.drawBullets();
        
        // 绘制气泡
        this.drawBubbles();
        
        // 绘制死亡鲨鱼
        this.drawDeadSharks();
        
        // 绘制活着的鲨鱼
        this.drawSharks();
        
        // 在最后绘制文字效果，确保显示在最上层
        this.drawTextEffects();
        
        // 在子弹之后绘制武器特效
        this.drawWeaponEffects();
    }
    
    drawCrosshair() {
        const mouseX = this.gun.x + Math.cos(this.gun.angle) * 200;
        const mouseY = this.gun.y + Math.sin(this.gun.angle) * 200;
        
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.gun.x, this.gun.y);
        this.ctx.lineTo(mouseX, mouseY);
        this.ctx.stroke();
        
        // 绘制瞄准圈
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.arc(mouseX, mouseY, 20, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 十字准星
        this.ctx.beginPath();
        this.ctx.moveTo(mouseX - 30, mouseY);
        this.ctx.lineTo(mouseX + 30, mouseY);
        this.ctx.moveTo(mouseX, mouseY - 30);
        this.ctx.lineTo(mouseX, mouseY + 30);
        this.ctx.stroke();
    }
    
    drawGun() {
        this.ctx.save();
        this.ctx.translate(this.gun.x, this.gun.y);
        this.ctx.rotate(this.gun.angle);
        
        // 制更精细的枪
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, -8, 50, 16);
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(40, -5, 15, 10);
        
        this.ctx.restore();
    }
    
    drawBullets() {
        this.bullets.forEach(bullet => {
            switch(bullet.effect) {
                case 'normal':
                    // 普通子弹
                    this.ctx.fillStyle = bullet.color;
                    this.ctx.beginPath();
                    this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                case 'spread':
                    // 霰弹粒子
                    this.ctx.fillStyle = bullet.color;
                    this.ctx.beginPath();
                    this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    // 添加拖尾效果
                    this.ctx.strokeStyle = `rgba(255, 165, 0, 0.3)`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(bullet.x, bullet.y);
                    this.ctx.lineTo(
                        bullet.x - Math.cos(bullet.angle) * 15,
                        bullet.y - Math.sin(bullet.angle) * 15
                    );
                    this.ctx.stroke();
                    break;
                case 'laser':
                    // 激光效果
                    this.ctx.strokeStyle = bullet.color;
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(bullet.x, bullet.y);
                    this.ctx.lineTo(
                        bullet.x + Math.cos(bullet.angle) * 30,
                        bullet.y + Math.sin(bullet.angle) * 30
                    );
                    this.ctx.stroke();
                    // 添加光晕效果
                    this.ctx.strokeStyle = `rgba(0, 255, 0, 0.3)`;
                    this.ctx.lineWidth = 6;
                    this.ctx.stroke();
                    break;
            }
        });
    }
    
    drawBubbles() {
        this.bubbles.forEach(bubble => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.opacity})`;
            this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            this.ctx.stroke();
        });
    }
    
    drawSharks() {
        this.sharks.forEach(shark => {
            this.ctx.save();
            this.ctx.translate(shark.x, shark.y);
            this.ctx.scale(-1, 1);
            
            if (shark.type === 'fish') {
                this.drawTropicalFish(shark);
            } else if (shark.type === 'greatWhite') {
                this.drawGreatWhite(shark);
            } else {
                this.drawNormalShark(shark);
            }
            
            this.ctx.restore();
        });
    }
    
    drawDeadSharks() {
        this.deadSharks.forEach(shark => {
            this.ctx.save();
            this.ctx.translate(shark.x, shark.y);
            this.ctx.rotate(shark.rotation);
            this.ctx.scale(-1, 1);
            this.ctx.globalAlpha = shark.opacity;
            
            // 根据类型绘制不同的亡生物
            if (shark.type === 'fish') {
                this.drawTropicalFish({...shark, breatheOffset: 0});
            } else if (shark.type === 'greatWhite') {
                this.drawGreatWhite({...shark, breatheOffset: 0});
            } else {
                this.drawNormalShark({...shark, breatheOffset: 0});
            }
            
            this.ctx.restore();
        });
    }
    
    drawTextEffects() {
        this.textEffects.forEach(effect => {
            this.ctx.save();
            this.ctx.globalAlpha = effect.opacity;
            this.ctx.translate(effect.x, effect.y);
            this.ctx.scale(effect.scale, effect.scale);
            
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            
            this.ctx.strokeText(effect.text, -50, 0);
            this.ctx.fillText(effect.text, -50, 0);
            
            this.ctx.restore();
        });
    }
    
    drawTropicalFish(fish) {
        // 绘制鱼身
        this.ctx.fillStyle = fish.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        // 更流线型的鱼身
        this.ctx.quadraticCurveTo(15 + fish.breatheOffset, -10, 20, -15);
        this.ctx.quadraticCurveTo(10, -25 + fish.breatheOffset, -5, -20);
        this.ctx.quadraticCurveTo(-15 - fish.breatheOffset, -10, 0, 0);
        this.ctx.fill();

        // 饰性条纹
        this.ctx.strokeStyle = fish.finColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(5, -8);
        this.ctx.lineTo(15, -15);
        this.ctx.moveTo(8, -12);
        this.ctx.lineTo(18, -18);
        this.ctx.stroke();

        // 绘制背鳍
        this.ctx.fillStyle = fish.finColor;
        this.ctx.beginPath();
        this.ctx.moveTo(5, -20);
        this.ctx.quadraticCurveTo(10, -30, 0, -25);
        this.ctx.fill();

        // 绘制尾鳍（更优雅的形状）
        this.ctx.beginPath();
        this.ctx.moveTo(-5, -10);
        this.ctx.quadraticCurveTo(-20, -20, -15, -5);
        this.ctx.quadraticCurveTo(-20, 5, -5, 0);
        this.ctx.fill();

        // 绘制眼睛（添加更多细节）
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(8, -12, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // 眼睛反光效果
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(8, -12, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(7, -13, 0.8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawGreatWhite(shark) {
        // 绘制身体主体部分
        this.ctx.fillStyle = shark.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        // 更流线型的身体轮廓
        this.ctx.quadraticCurveTo(50 + shark.breatheOffset, -30, 70, -50);
        this.ctx.quadraticCurveTo(30, -90 + shark.breatheOffset, -30, -70);
        this.ctx.quadraticCurveTo(-50 - shark.breatheOffset, -30, 0, 0);
        this.ctx.fill();

        // 绘制白色腹部
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -5);
        this.ctx.quadraticCurveTo(40, -25, 60, -45);
        this.ctx.quadraticCurveTo(20, -60, -20, -50);
        this.ctx.quadraticCurveTo(-40, -25, 0, -5);
        this.ctx.fill();

        // 添加鲨鱼皮肤纹理
        this.ctx.strokeStyle = '#566573';
        this.ctx.lineWidth = 2;
        for(let i = 0; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(10 + i*15, -45);
            this.ctx.quadraticCurveTo(25 + i*15, -60 + Math.sin(i) * 5, 15 + i*15, -75);
            this.ctx.stroke();
        }

        // 绘制背鳍
        this.ctx.fillStyle = shark.finColor;
        this.ctx.beginPath();
        this.ctx.moveTo(15, -55);
        this.ctx.lineTo(45, -100);
        this.ctx.lineTo(0, -75);
        this.ctx.closePath();
        this.ctx.fill();

        // 绘制胸鳍
        this.ctx.beginPath();
        this.ctx.moveTo(25, -30);
        this.ctx.quadraticCurveTo(50, -20, 60, -45);
        this.ctx.quadraticCurveTo(45, -50, 25, -30);
        this.ctx.fill();

        // 绘制新的尾鳍（更真实的月牙形状）
        this.ctx.beginPath();
        // 上尾鳍
        this.ctx.moveTo(-25, -40);
        this.ctx.quadraticCurveTo(-45, -70, -35, -90);
        this.ctx.quadraticCurveTo(-55, -70, -65, -60);
        // 下尾鳍
        this.ctx.moveTo(-25, -40);
        this.ctx.quadraticCurveTo(-45, -20, -65, -30);
        this.ctx.quadraticCurveTo(-55, -40, -35, -40);
        this.ctx.fill();

        // 绘制鳃
        this.ctx.strokeStyle = '#34495E';
        this.ctx.lineWidth = 3;
        for(let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(30 - i*8, -25);
            this.ctx.quadraticCurveTo(35 - i*8, -35, 30 - i*8, -45);
            this.ctx.stroke();
        }

        // 绘制眼睛
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(35, -50, 6, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#2C3E50';
        this.ctx.beginPath();
        this.ctx.arc(35, -50, 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(36, -51, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // 添加细节阴影
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(40, -60);
        this.ctx.quadraticCurveTo(20, -75 + shark.breatheOffset, -20, -65);
        this.ctx.stroke();
    }
    
    drawNormalShark(shark) {
        // 绘制身体
        this.ctx.fillStyle = shark.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.quadraticCurveTo(35 + shark.breatheOffset, -25, 45, -45);
        this.ctx.quadraticCurveTo(15, -65 + shark.breatheOffset, -25, -55);
        this.ctx.quadraticCurveTo(-35 - shark.breatheOffset, -25, 0, 0);
        this.ctx.fill();

        // 绘制白色腹部
        this.ctx.fillStyle = '#E5E8E8';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -5);
        this.ctx.quadraticCurveTo(30, -20, 40, -40);
        this.ctx.quadraticCurveTo(10, -50, -20, -45);
        this.ctx.quadraticCurveTo(-30, -20, 0, -5);
        this.ctx.fill();

        // 添加鲨鱼皮肤纹理
        this.ctx.strokeStyle = '#34495E';
        this.ctx.lineWidth = 1.5;
        for(let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(5 + i*12, -35);
            this.ctx.quadraticCurveTo(15 + i*12, -45 + Math.sin(i) * 3, 8 + i*12, -55);
            this.ctx.stroke();
        }

        // 绘制背鳍
        this.ctx.fillStyle = shark.finColor;
        this.ctx.beginPath();
        this.ctx.moveTo(10, -40);
        this.ctx.lineTo(30, -70);
        this.ctx.lineTo(-5, -55);
        this.ctx.closePath();
        this.ctx.fill();

        // 绘制胸鳍
        this.ctx.beginPath();
        this.ctx.moveTo(20, -25);
        this.ctx.quadraticCurveTo(35, -20, 40, -35);
        this.ctx.quadraticCurveTo(30, -40, 20, -25);
        this.ctx.fill();

        // 绘制新的尾鳍（更真实的月牙形状，但比大白鲨小）
        this.ctx.beginPath();
        // 上尾鳍
        this.ctx.moveTo(-20, -35);
        this.ctx.quadraticCurveTo(-35, -55, -25, -70);
        this.ctx.quadraticCurveTo(-45, -55, -50, -45);
        // 下尾鳍
        this.ctx.moveTo(-20, -35);
        this.ctx.quadraticCurveTo(-35, -20, -50, -25);
        this.ctx.quadraticCurveTo(-45, -35, -25, -35);
        this.ctx.fill();

        // ��制鳃
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 2;
        for(let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(25 - i*6, -20);
            this.ctx.quadraticCurveTo(28 - i*6, -30, 25 - i*6, -40);
            this.ctx.stroke();
        }

        // 绘制眼睛
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(25, -40, 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#2C3E50';
        this.ctx.beginPath();
        this.ctx.arc(25, -40, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(26, -41, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawWeaponEffects() {
        this.weaponEffects.forEach(effect => {
            switch(effect.type) {
                case 'flash':
                    // 绘制枪口闪光
                    this.ctx.fillStyle = `rgba(255, 200, 0, ${effect.opacity})`;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                case 'particle':
                    // 绘制粒子效果
                    this.ctx.fillStyle = `rgba(255, 165, 0, ${effect.opacity})`;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                case 'laser':
                    // 绘制激光效果
                    const gradient = this.ctx.createLinearGradient(
                        effect.x, effect.y,
                        effect.x + Math.cos(effect.angle) * effect.length,
                        effect.y + Math.sin(effect.angle) * effect.length
                    );
                    gradient.addColorStop(0, `rgba(0, 255, 0, ${effect.opacity})`);
                    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
                    
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = effect.width;
                    this.ctx.beginPath();
                    this.ctx.moveTo(effect.x, effect.y);
                    this.ctx.lineTo(
                        effect.x + Math.cos(effect.angle) * effect.length,
                        effect.y + Math.sin(effect.angle) * effect.length
                    );
                    this.ctx.stroke();
                    break;
            }
        });
    }
}

// 启动游戏
window.onload = () => {
    new Game();
}; 