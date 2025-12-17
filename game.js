
// 游戏常量定义
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 3;
const ACCELERATED_SPEED = 5;

// 游戏状态
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    coins: 0,
    isRunning: false,
    isPaused: false
};

// 游戏对象
const game = {
    canvas: null,
    ctx: null,
    mario: null,
    platforms: [],
    coins: [],
    enemies: [],
    keys: {},
    animationId: null
};

// 玛丽角色类
class Mario {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.velocityY = 0;
        this.velocityX = 0;
        this.isOnGround = false;
        this.isJumping = false;
        this.direction = 1; // 1为右，-1为左
        this.isMoving = false;
    }
    
    update() {
        // 水平移动
        if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) {
            this.velocityX = (game.keys['Shift']) ? -ACCELERATED_SPEED : -MOVE_SPEED;
            this.direction = -1;
            this.isMoving = true;
        } else if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) {
            this.velocityX = (game.keys['Shift']) ? ACCELERATED_SPEED : MOVE_SPEED;
            this.direction = 1;
            this.isMoving = true;
        } else {
            this.velocityX = 0;
            this.isMoving = false;
        }
        
        // 跳跃
        if ((game.keys['ArrowUp'] || game.keys['w'] || game.keys['W'] || game.keys[' ']) && this.isOnGround) {
            this.velocityY = JUMP_FORCE;
            this.isOnGround = false;
            this.isJumping = true;
        }
        
        // 应用重力
        this.velocityY += GRAVITY;
        
        // 更新位置
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // 边界检测
        if (this.x < 0) this.x = 0;
        if (this.x > game.canvas.width - this.width) this.x = game.canvas.width - this.width;
        if (this.y > game.canvas.height - this.height) {
            this.y = game.canvas.height - this.height;
            this.velocityY = 0;
            this.isOnGround = true;
            this.isJumping = false;
        }
        
        // 平台碰撞检测
        this.isOnGround = false;
        game.platforms.forEach(platform => {
            if (this.isCollidingWith(platform)) {
                // 从上方落下
                if (this.velocityY > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.isOnGround = true;
                    this.isJumping = false;
                }
                // 从下方撞击
                else if (this.velocityY < 0 && this.y > platform.y) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
                // 从左侧撞击
                else if (this.velocityX > 0 && this.x < platform.x) {
                    this.x = platform.x - this.width;
                }
                // 从右侧撞击
                else if (this.velocityX < 0 && this.x > platform.x) {
                    this.x = platform.x + platform.width;
                }
            }
        });
    }
    
    draw(ctx) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制脸部
        ctx.fillStyle = '#000000';
        if (this.direction === 1) {
            ctx.fillRect(this.x + 20, this.y + 10, 5, 5); // 右眼
        } else {
            ctx.fillRect(this.x + 5, this.y + 10, 5, 5); // 左眼
        }
        ctx.fillRect(this.x + 10, this.y + 25, 10, 3); // 嘴巴
    }
    
    isCollidingWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
}

// 平台类
class Platform {
    constructor(x, y, width, height, color = '#8B4513') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 添加平台纹理
        ctx.fillStyle = '#A0522D';
        for (let i = 0; i < this.width; i += 20) {
            ctx.fillRect(this.x + i, this.y, 10, 5);
        }
    }
}

// 金币类
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.collected = false;
        this.animation = 0;
    }
    
    update() {
        this.animation = (this.animation + 0.1) % (Math.PI * 2);
    }
    
    draw(ctx) {
        if (!this.collected) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            const centerY = this.y + Math.sin(this.animation) * 2;
            ctx.arc(this.x + this.width/2, centerY + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // 金币光泽效果
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(this.x + this.width/3, centerY + this.height/3, this.width/6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 敌人类
class Enemy {
    constructor(x, y, type = 'goomba') {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type;
        this.velocityX = -1;
        this.alive = true;
    }
    
    update() {
        if (this.alive) {
            this.x += this.velocityX;
            
            // 边界转向
            if (this.x < 0 || this.x > game.canvas.width - this.width) {
                this.velocityX *= -1;
            }
        }
    }
    
    draw(ctx) {
        if (this.alive) {
            if (this.type === 'goomba') {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                // 眼睛
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
                ctx.fillRect(this.x + 18, this.y + 8, 4, 4);
            }
        }
    }
}

// 初始化游戏
function initGame() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    // 创建玛丽
    game.mario = new Mario(50, 300);
    
    // 创建平台
    createPlatforms();
    
    // 创建金币
    createCoins();
    
    // 创建敌人
    createEnemies();
    
    // 事件监听
    setupEventListeners();
    
    // 更新UI
    updateUI();
}

// 创建平台
function createPlatforms() {
    game.platforms = [
        new Platform(0, 380, 800, 20, '#8B4513'),      // 地面
        new Platform(200, 300, 100, 20, '#228B22'),    // 草地平台
        new Platform(400, 250, 100, 20, '#228B22'),
        new Platform(600, 200, 100, 20, '#228B22'),
        new Platform(300, 150, 80, 20, '#228B22'),
        new Platform(500, 100, 80, 20, '#228B22')
    ];
}

// 创建金币
function createCoins() {
    game.coins = [
        new Coin(230, 270),
        new Coin(430, 220),
        new Coin(630, 170),
        new Coin(330, 120),
        new Coin(530, 70),
        new Coin(100, 350),
        new Coin(700, 350)
    ];
}

// 创建敌人
function createEnemies() {
    game.enemies = [
        new Enemy(300, 350, 'goomba'),
        new Enemy(500, 350, 'goomba'),
        new Enemy(650, 170, 'goomba')
    ];
}

// 设置事件监听
function setupEventListeners() {
    // 键盘事件
    window.addEventListener('keydown', (e) => {
        game.keys[e.key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
        game.keys[e.key] = false;
    });
    
    // 按钮事件
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
}

// 游戏主循环
function gameLoop() {
    if (!gameState.isPaused && gameState.isRunning) {
        update();
        render();
        game.animationId = requestAnimationFrame(gameLoop);
    }
}

// 更新游戏状态
function update() {
    // 更新玛丽
    game.mario.update();
    
    // 更新金币动画
    game.coins.forEach(coin => coin.update());
    
    // 更新敌人
    game.enemies.forEach(enemy => enemy.update());
    
    // 金币收集检测
    game.coins.forEach(coin => {
        if (!coin.collected && game.mario.isCollidingWith(coin)) {
            coin.collected = true;
            gameState.coins++;
            gameState.score += 100;
            updateUI();
        }
    });
    
    // 敌人碰撞检测
    game.enemies.forEach(enemy => {
        if (enemy.alive && game.mario.isCollidingWith(enemy)) {
            // 从上方踩踏敌人
            if (game.mario.velocityY > 0 && game.mario.y < enemy.y) {
                enemy.alive = false;
                game.mario.velocityY = JUMP_FORCE / 2;
                gameState.score += 200;
                updateUI();
            } else {
                // 玛丽受伤
                gameState.lives--;
                updateUI();
                if (gameState.lives <= 0) {
                    gameOver();
                } else {
                    // 重置玛丽位置
                    game.mario.x = 50;
                    game.mario.y = 300;
                }
            }
        }
    });
    
    // 检查是否到达终点
    if (game.mario.x > 750) {
        nextLevel();
    }
}

// 渲染游戏画面
function render() {
    // 清空画布
    game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    
    // 
