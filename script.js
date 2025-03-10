// 滚动动画
document.addEventListener('DOMContentLoaded', () => {
    // 创建发光元素
    const cursor = document.createElement('div');
    cursor.className = 'cursor-glow';
    document.body.appendChild(cursor);

    // 跟踪鼠标移动
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // 鼠标进入可点击元素时的效果
    document.querySelectorAll('a, button, .portfolio-item').forEach(elem => {
        elem.addEventListener('mouseenter', () => {
            cursor.classList.add('active');
        });
        elem.addEventListener('mouseleave', () => {
            cursor.classList.remove('active');
        });
    });

    // 修改开场动画逻辑
    const startButton = document.querySelector('.start-button');
    const introCircle = document.querySelector('.intro-circle');
    const introAnimation = document.querySelector('.intro-animation');
    const contentWrapper = document.querySelector('.content-wrapper');
    
    // 初始化内容包装器
    contentWrapper.style.opacity = '0';
    contentWrapper.style.visibility = 'hidden';

    // 添加按钮点击事件
    startButton.addEventListener('click', () => {
        // 隐藏按钮
        startButton.style.opacity = '0';
        
        // 确保页面在顶部
        window.scrollTo(0, 0);
        
        // 动画圆形
        introCircle.classList.add('animate-circle');
        
        // 延迟后隐藏介绍动画
        setTimeout(() => {
            introAnimation.classList.add('animate-intro');
            
            // 显示内容
            contentWrapper.style.visibility = 'visible';
            contentWrapper.style.opacity = '1';
            
            // 不要添加欢迎文字的淡出动画
            const welcomeText = document.querySelector('.welcome-text');
            if (welcomeText) {
                welcomeText.style.opacity = '1';
            }
            
            // 启动樱花效果
            startSakura();
            
            // 延迟后完全移除介绍动画
            setTimeout(() => {
                introAnimation.style.display = 'none';
                
                // 添加滚动监听
                addScrollListeners();
            }, 1000);
        }, 1000);
    });

    // 添加滚动监听函数
    function addScrollListeners() {
        const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
        
        // 初始检查
        checkElements(animatedElements);
        
        // 滚动时检查
        window.addEventListener('scroll', () => {
            checkElements(animatedElements);
        });
    }

    // 检查元素是否在视口中
    function checkElements(elements) {
        const triggerBottom = window.innerHeight * 0.8;
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < triggerBottom) {
                element.classList.add('visible');
            }
        });
    }

    // 添加视差效果
    window.addEventListener('scroll', () => {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(window.scrollY * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });

    // 作品分类功能
    const portfolioTabs = document.querySelectorAll('.portfolio-tab');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    // 确保初始状态下所有项目都可见
    portfolioItems.forEach(item => {
        item.style.display = 'block';
        item.style.opacity = '1';
        item.style.transform = 'scale(1)';
    });
    
    portfolioTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有标签的active类
            portfolioTabs.forEach(t => t.classList.remove('active'));
            // 给当前点击的标签添加active类
            tab.classList.add('active');
            
            const category = tab.dataset.category;
            
            // 显示或隐藏作品项目
            portfolioItems.forEach(item => {
                // 如果是"全部"类别或者项目类别匹配当前选择的类别
                if (category === 'all' || item.dataset.category.includes(category)) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 500);
                }
            });
        });
    });

    // 获取模态框元素
    const modal = document.getElementById('projectModal');
    const closeModal = document.querySelector('.close-modal');
    const modalTitle = document.querySelector('.modal-title');
    const modalGallery = document.querySelector('.modal-gallery');
    const modalDescription = document.querySelector('.modal-description');
    
    // 关闭模态框
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // 恢复滚动
        });
    }
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // 为所有作品项目添加点击事件
    portfolioItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 获取项目标题和类别
            const imgElement = item.querySelector('img, video');
            if (!imgElement) return;
            
            const altText = imgElement.getAttribute('alt');
            const overlayTitle = item.querySelector('.portfolio-overlay h3')?.textContent || altText;
            const overlayCategory = item.querySelector('.portfolio-overlay p')?.textContent || '';
            const isVideo = imgElement.tagName.toLowerCase() === 'video';
            
            // 设置模态框标题
            modalTitle.textContent = `${overlayTitle} - 项目详情`;
            
            // 根据不同项目设置不同的内容
            switch (altText) {
                case '背景绘画':
                    // 使用已有的背景绘画模态框内容
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <img src="image/school/24FA_MonBGptg_Wk12_v02_Jay.png" alt="背景绘画" class="full-width-image">
                            <div class="image-caption">白天场景</div>
                        </div>
                        <div class="modal-image-container">
                            <img src="image/school/24FA_MonBGptg_Wk12_v02_Jay_JB-copy-(1).png" alt="背景绘画夜晚" class="full-width-image">
                            <div class="image-caption">夜晚场景</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>该项目的要求是在同一个场景中创作白天和夜晚两个版本，展示不同光照条件下的环境氛围变化。</p>
                        
                        <h3>设计理念</h3>
                        <p>这个场景描绘了一位魔法师来到宁静的雪村。白天版本展现了明亮、清新的氛围，而夜晚版本则通过月光和魔法元素的光芒创造出神秘而梦幻的感觉。</p>
                        
                        <h3>技术实现</h3>
                        <p>通过精心设计的光影处理和色彩选择，我成功地在保持场景一致性的同时，展现了白天与夜晚截然不同的视觉效果和情感氛围。</p>
                    `;
                    break;
                    
                case '猫咪日记':
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <img src="image/school/cat diary (1).png" alt="猫咪日记" class="full-width-image">
                            <div class="image-caption">猫咪日记项目</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>这是一个journalism课程作业，要求我们用身边日常生活中的事物创作一个journalism项目。</p>
                        
                        <h3>创作理念</h3>
                        <p>我选择了记录我家猫咪的日常生活作为主题，通过观察和记录它的行为、习惯和有趣瞬间，创作了这本猫咪日记。</p>
                        
                        <h3>表现手法</h3>
                        <p>我使用了温暖的色调和生动的描绘方式，真实记录猫咪的日常，展现宠物与主人之间的情感联系，以及猫咪独特的个性和魅力。</p>
                    `;
                    break;
                    
                case 'Photoshop基础':
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <img src="image/school/class_work photoshop fundomental.png" alt="Photoshop基础" class="full-width-image">
                            <div class="image-caption">数字绘画作品</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>这是Photoshop数字绘画基础课程的作业，旨在掌握软件的核心功能和数字绘画的基本技巧。</p>
                        
                        <h3>技术要点</h3>
                        <p>在这个项目中，我运用了图层管理、混合模式、画笔技巧和色彩调整等Photoshop核心功能，创作了这幅数字插画。</p>
                        
                        <h3>学习收获</h3>
                        <p>通过这个项目，我主要想要练习如何使用Photoshop的各种工具和技术来创造更好的画质感。特别是在光影处理、纹理表现和色彩过渡方面，我尝试了多种方法来提升作品的视觉质量和真实感。</p>
                    `;
                    break;
                    
                case '创意透视':
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <img src="image/school/Screenshot 2025-03-01 212506.png" alt="创意透视" class="full-width-image">
                            <div class="image-caption">成品</div>
                        </div>
                        <div class="modal-image-container">
                            <img src="image/school/creative prespetive.jpg" alt="创意透视过程" class="full-width-image">
                            <div class="image-caption">过程</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>这是环境设计课程的作业，要求运用透视原理创建具有空间感和深度的场景。通过这个项目，我学习了解人物和场景大小关系，并利用SketchUp这个3D软件来确认船的透视。在获取3D船模型的基础上，我设计了自己的概念，最终完成了这幅作品。</p>
                        
                        <h3>设计理念</h3>
                        <p>我创作了这个未来城市场景，表现了一个绝大部分人们都被统治的世界。通过精确的透视关系和光影处理，营造出既宏大又压抑的视觉体验。</p>
                        
                        <h3>技术挑战</h3>
                        <p>项目中最大的挑战是处理复杂的透视关系和多点光源。通过反复研究和实践，结合SketchUp软件的辅助，我成功地解决了这些问题，使画面既符合透视规律又具有艺术表现力。</p>
                    `;
                    break;
                    
                case 'Maya 3D建模':
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <img src="image/school/maya.png" alt="Maya 3D建模" class="full-width-image">
                            <div class="image-caption">3D模型渲染</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>这是3D建模课程的作业，使用Maya软件创建和渲染3D模型。</p>
                        
                        <h3>技术要点</h3>
                        <p>在这个项目中，我学习了多边形建模、UV贴图、材质设置和灯光渲染等Maya核心功能，创建了这个3D场景。</p>
                        
                        <h3>创作过程</h3>
                        <p>从基础几何体开始，通过细化、雕刻和纹理绘制，逐步完善模型细节。最后通过精心设置的灯光和渲染参数，呈现出最终效果。</p>
                    `;
                    break;
                    
                case '视觉开发':
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <img src="image/school/vis dev.jpg" alt="视觉开发" class="full-width-image">
                            <div class="image-caption">视觉开发作品</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>这是视觉开发课程的作业，要求为特定故事或场景创建视觉风格和氛围。</p>
                        
                        <h3>设计理念</h3>
                        <p>我为这个项目创建了一个融合东方神话与现代元素的视觉世界，通过独特的色彩方案和构图，传达出神秘而又亲切的氛围。</p>
                        
                        <h3>工作流程</h3>
                        <p>从概念草图到色彩测试，再到最终渲染，整个过程注重视觉一致性和故事性，确保所有元素都服务于整体视觉叙事。</p>
                    `;
                    break;
                    
                case '艺术家':
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <img src="image/personal/artist (1).png" alt="艺术家" class="full-width-image">
                            <div class="image-caption">角色设计</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>这是我的个人创作项目，旨在探索艺术家这一角色的内心世界和创作状态。</p>
                        
                        <h3>设计理念</h3>
                        <p>通过这个角色，我想表达艺术创作过程中的专注、热情和孤独。角色的姿态和表情传达了沉浸在创作中的状态，而周围的元素则象征着艺术家丰富的想象力。</p>
                        
                        <h3>技术实现</h3>
                        <p>这幅作品采用了数字绘画技术，注重光影效果和细节刻画，通过精心设计的构图和色彩，营造出温暖而又充满创意的氛围。</p>
                    `;
                    break;
                    
                case '个人项目':
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <img src="image/personal/personal project.jpg" alt="个人项目" class="full-width-image">
                            <div class="image-caption">概念设计</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>这是我的个人概念设计项目，探索未来与传统的融合。</p>
                        
                        <h3>设计理念</h3>
                        <p>在这个项目中，我尝试将传统东方元素与未来科技感相结合，创造出一个既熟悉又陌生的视觉世界。通过对比和融合，表达对文化传承与创新的思考。</p>
                        
                        <h3>创作过程</h3>
                        <p>从初期概念草图到多次迭代，我不断调整构图、色彩和细节，最终呈现出这个平衡传统与现代的作品。整个过程注重视觉冲击力和情感表达。</p>
                    `;
                    break;
                    
                case '樱花村':
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <img src="image/personal/sakura-villege.png" alt="樱花村" class="full-width-image">
                            <div class="image-caption">环境概念设计</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>这是我的个人环境概念设计项目，灵感来源于日本传统村落和樱花季节的美丽景色。</p>
                        
                        <h3>设计理念</h3>
                        <p>我想通过这个作品捕捉樱花盛开时的宁静与梦幻，同时展现传统建筑与自然景观的和谐共存。柔和的色调和飘落的花瓣创造出一种超脱现实的氛围。</p>
                        
                        <h3>技术实现</h3>
                        <p>这幅作品采用了数字绘画技术，特别注重光影效果和氛围营造。通过精细的笔触和层次感的处理，呈现出樱花飘落的动态美感和空间的深度。</p>
                    `;
                    break;
                    
                case '世界树':
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <img src="image/personal/world tree.png" alt="世界树" class="full-width-image">
                            <div class="image-caption">概念设计</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>这是我的个人概念设计项目，探索世界树这一神话元素在现代视觉语言中的表达。</p>
                        
                        <h3>设计理念</h3>
                        <p>世界树在许多文化中都是连接天地的象征。在这个作品中，我尝试将这一古老概念与现代科幻元素结合，创造出一个既神秘又宏大的视觉形象。</p>
                        
                        <h3>创作过程</h3>
                        <p>从初期构思到最终呈现，我注重树木的生命力和神秘感的表达。通过特殊的光效和构图，强调了世界树的宏伟与超凡，同时保留了自然生长的有机感。</p>
                    `;
                    break;
                    
                case '寺庙':
                    // 检查文件扩展名是否正确（从.png改为.jpg）
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <img src="image/personal/寺庙草稿.jpg" alt="寺庙" class="full-width-image">
                            <div class="image-caption">完成品</div>
                        </div>
                        <div class="modal-image-container">
                            <img src="image/personal/na_shi-.jpg" alt="那时" class="full-width-image">
                            <div class="image-caption">过程</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>这是一个融合东方传统美学与现代数字技术的概念设计项目。灵感来源于中国古代寺庙建筑与自然景观的和谐统一。</p>
                        
                        <h3>创作过程</h3>
                        <p>从初期草图到最终渲染，整个过程注重细节与氛围的营造。通过多层次的光影处理，展现出空间的深度与神秘感。</p>
                        
                        <h3>设计理念</h3>
                        <p>想设计一个低角度视角(Low Angle Shot)来呈现这座荒废的寺庙，通过这种视角增强建筑的宏伟感和神秘氛围，同时展现岁月流逝的痕迹与自然侵蚀的美感。</p>
                    `;
                    break;
                    
                case '速写视频':
                case '速写视频2':
                    // 视频项目的处理
                    const videoSrc = imgElement.getAttribute('src');
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            <video src="${videoSrc}" controls autoplay muted class="full-width-image">
                                您的浏览器不支持视频标签。
                            </video>
                            <div class="image-caption">创作过程视频</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目背景</h3>
                        <p>这是我的速写创作过程记录，展示了从构思到完成的整个绘画流程。</p>
                        
                        <h3>创作方法</h3>
                        <p>视频记录了我的数字绘画过程，包括线稿绘制、基础上色、细节刻画和最终效果调整等阶段。</p>
                        
                        <h3>技术要点</h3>
                        <p>在创作过程中，我运用了多种数字绘画技巧，包括图层管理、画笔技法和色彩调整等，展示了专业数字艺术工作流程。</p>
                    `;
                    break;
                    
                default:
                    // 默认情况下显示基本信息
                    const imgSrc = isVideo ? imgElement.getAttribute('src') : imgElement.getAttribute('src');
                    const mediaElement = isVideo ? 
                        `<video src="${imgSrc}" controls autoplay muted class="full-width-image">
                            您的浏览器不支持视频标签。
                         </video>` : 
                        `<img src="${imgSrc}" alt="${altText}" class="full-width-image">`;
                    
                    modalGallery.innerHTML = `
                        <div class="modal-image-container">
                            ${mediaElement}
                            <div class="image-caption">${overlayTitle}</div>
                        </div>
                    `;
                    
                    modalDescription.innerHTML = `
                        <h3>项目信息</h3>
                        <p>${overlayTitle} - ${overlayCategory}</p>
                        
                        <h3>详细描述</h3>
                        <p>这是我的${overlayCategory}作品，展示了我在${overlayTitle}方面的创作能力和技术水平。</p>
                    `;
                    break;
            }
            
            // 显示模态框
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        });
    });

    // 优化樱花效果函数
    function startSakura() {
        // 检查是否已存在樱花容器，如果存在则移除
        const existingContainer = document.querySelector('.sakura-container');
        if (existingContainer) {
            // 清除之前的定时器
            if (existingContainer.dataset.intervalId) {
                clearInterval(parseInt(existingContainer.dataset.intervalId));
            }
            existingContainer.remove();
        }
        
        const sakuraContainer = document.createElement('div');
        sakuraContainer.className = 'sakura-container';
        document.body.appendChild(sakuraContainer);
        
        // 创建樱花
        function createSakura() {
            const sakura = document.createElement('div');
            sakura.className = 'sakura';
            sakura.innerHTML = '❀';
            sakura.style.left = Math.random() * 100 + 'vw';
            sakura.style.fontSize = Math.random() * 10 + 10 + 'px';
            sakura.style.animationDuration = Math.random() * 10 + 10 + 's';
            sakuraContainer.appendChild(sakura);
            
            // 动画结束后移除
            setTimeout(() => {
                if (sakura && sakura.parentNode) {
                    sakura.remove();
                }
            }, 20000);
        }
        
        // 初始创建一些樱花，但数量减少
        for (let i = 0; i < 10; i++) {
            setTimeout(createSakura, 300 * i);
        }
        
        // 持续创建樱花，但限制数量和频率
        const sakuraInterval = setInterval(() => {
            // 如果樱花数量超过30个，则不再创建
            if (sakuraContainer.children.length < 30) {
                createSakura();
            }
        }, 2000); // 降低创建频率
        
        // 保存interval ID以便需要时清除
        sakuraContainer.dataset.intervalId = sakuraInterval;
    }

    // 添加动画类
    function addAnimationClasses() {
        // 添加淡入动画
        document.querySelectorAll('.fade-in').forEach((element, index) => {
            element.style.animationDelay = `${index * 0.2}s`;
        });
        
        // 添加左侧滑入动画
        document.querySelectorAll('.slide-in-left').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateX(-50px)';
            element.style.transition = 'all 0.8s ease';
        });
        
        // 添加右侧滑入动画
        document.querySelectorAll('.slide-in-right').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateX(50px)';
            element.style.transition = 'all 0.8s ease';
        });
        
        // 添加缩放动画
        document.querySelectorAll('.scale-in').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'scale(0.9)';
            element.style.transition = 'all 0.8s ease';
        });
    }
    
    // 初始化动画类
    addAnimationClasses();
    
    // 添加可见性类
    document.addEventListener('scroll', () => {
        document.querySelectorAll('.slide-in-left, .slide-in-right, .scale-in').forEach(element => {
            const position = element.getBoundingClientRect();
            
            // 检查元素是否在视口中
            if (position.top < window.innerHeight * 0.8) {
                element.style.opacity = '1';
                element.style.transform = 'translateX(0) scale(1)';
            }
        });
    });
    
    // 初始检查可见元素
    setTimeout(() => {
        const event = new Event('scroll');
        document.dispatchEvent(event);
    }, 100);

    // 修改滚动监听部分，使樱花效果在向上滚动时重新出现
    window.addEventListener('scroll', () => {
        // 获取 About Me 部分的位置
        const aboutSection = document.querySelector('.about');
        if (!aboutSection) return;
        
        const aboutPosition = aboutSection.getBoundingClientRect().top;
        const screenPosition = window.innerHeight * 0.7; // 当 About Me 部分进入视口的 70% 位置时
        
        // 获取樱花容器
        let sakuraContainer = document.querySelector('.sakura-container');
        
        // 如果滚动到 About Me 部分，则淡出并最终移除樱花效果
        if (aboutPosition < screenPosition) {
            if (sakuraContainer) {
                sakuraContainer.style.opacity = '0';
                
                // 延迟后完全移除樱花容器
                setTimeout(() => {
                    // 清除定时器
                    if (sakuraContainer && sakuraContainer.dataset.intervalId) {
                        clearInterval(parseInt(sakuraContainer.dataset.intervalId));
                    }
                    // 移除容器
                    if (sakuraContainer && sakuraContainer.parentNode) {
                        sakuraContainer.remove();
                    }
                }, 1000);
            }
        } else {
            // 如果向上滚动离开 About Me 部分，且樱花容器不存在，则重新创建
            if (!sakuraContainer) {
                // 重新创建樱花效果
                startSakura();
            } else if (sakuraContainer.style.opacity === '0') {
                // 如果容器存在但是透明度为0，则恢复显示
                sakuraContainer.style.opacity = '1';
            }
        }
    });

    // 修改控制 PORTFOLIO 文字透明度的代码
    window.addEventListener('scroll', () => {
        const welcomeText = document.querySelector('.welcome-text');
        if (!welcomeText) return;
        
        // 获取滚动距离
        const scrollPosition = window.scrollY;
        
        // 设置透明度变化的阈值（可以根据需要调整）
        const fadeStart = 100; // 开始淡出的滚动位置
        const fadeEnd = 500;   // 完全透明的滚动位置
        
        // 计算透明度
        let opacity = 1;
        
        if (scrollPosition > fadeStart) {
            opacity = 1 - (scrollPosition - fadeStart) / (fadeEnd - fadeStart);
            opacity = Math.max(0, opacity); // 确保透明度不小于0
        }
        
        // 应用透明度
        welcomeText.style.opacity = opacity;
    });

    // 添加小角色的眼睛跟随鼠标功能
    const character = document.querySelector('.little-character');
    const pupils = document.querySelectorAll('.pupil');
    
    if (character && pupils.length) {
        // 眼睛跟随鼠标移动
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            pupils.forEach(pupil => {
                const eyeRect = pupil.parentElement.getBoundingClientRect();
                const eyeCenterX = eyeRect.left + eyeRect.width / 2;
                const eyeCenterY = eyeRect.top + eyeRect.height / 2;
                
                // 计算眼睛和鼠标之间的角度
                const angle = Math.atan2(mouseY - eyeCenterY, mouseX - eyeCenterX);
                
                // 限制眼球移动范围
                const distance = Math.min(3, Math.hypot(mouseX - eyeCenterX, mouseY - eyeCenterY) / 20);
                
                // 移动眼球
                const pupilX = Math.cos(angle) * distance;
                const pupilY = Math.sin(angle) * distance;
                
                pupil.style.transform = `translate(calc(-50% + ${pupilX}px), calc(-50% + ${pupilY}px))`;
            });
        });
        
        // 点击小角色时让它消失
        character.addEventListener('click', () => {
            character.style.opacity = '0';
            character.style.transform = 'scale(0) rotate(360deg)';
            
            // 动画结束后移除元素
            setTimeout(() => {
                character.remove();
            }, 500);
        });
    }
});

