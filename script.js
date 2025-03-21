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

    // 处理视频点击播放/暂停功能
    const videoContainers = document.querySelectorAll('.video-container');
    
    videoContainers.forEach(container => {
        const video = container.querySelector('video');
        const playIcon = container.querySelector('.play-icon');
        
        container.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止冒泡，防止触发作品项目的点击事件
            
            if (video.paused) {
                // 如果视频是暂停状态，播放视频并隐藏播放图标
                video.play();
                video.setAttribute('loop', 'true');
                playIcon.style.opacity = '0';
            } else {
                // 如果视频正在播放，暂停视频并显示播放图标
                video.pause();
                playIcon.style.opacity = '0.8';
            }
        });
        
        // 视频播放结束后显示播放图标
        video.addEventListener('ended', () => {
            playIcon.style.opacity = '0.8';
        });
    });

    // 处理开场动画
    // 检查是否已经显示过开场动画
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    const introAnimation = document.querySelector('.intro-animation');
    
    // 如果页面上有开场动画元素
    if (introAnimation) {
        // 如果已经显示过开场动画，则直接隐藏
        if (hasSeenIntro) {
            introAnimation.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // 确保内容可见
            const contentWrapper = document.querySelector('.content-wrapper');
            if (contentWrapper) {
                contentWrapper.style.opacity = '1';
                contentWrapper.style.visibility = 'visible';
            }
            
            // 如果是首页，显示樱花
            if (isHomePage()) {
                showCherryBlossoms();
            }
        } else {
            // 否则显示开场动画并记录状态
            sessionStorage.setItem('hasSeenIntro', 'true');
            
            // 确保内容初始隐藏
            const contentWrapper = document.querySelector('.content-wrapper');
            if (contentWrapper) {
                contentWrapper.style.opacity = '0';
                contentWrapper.style.visibility = 'hidden';
            }
            
            const startButton = document.querySelector('.start-button');
            const introCircle = document.querySelector('.intro-circle');
            
            if (startButton) {
                startButton.addEventListener('click', function() {
                    introCircle.classList.add('animate-circle');
                    setTimeout(function() {
                        introAnimation.classList.add('animate-intro');
                        document.body.style.overflow = 'auto';
                        
                        // 显示内容
                        if (contentWrapper) {
                            contentWrapper.style.opacity = '1';
                            contentWrapper.style.visibility = 'visible';
                        }
                        
                        // 添加樱花动画
                        showCherryBlossoms();
                    }, 1000);
                });
            }
        }
    } else {
        // 如果没有开场动画元素，确保内容可见
        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
            contentWrapper.style.opacity = '1';
            contentWrapper.style.visibility = 'visible';
        }
        
        // 如果是首页，显示樱花
        if (isHomePage()) {
            showCherryBlossoms();
        }
    }

    // 添加滚动监听函数
    addScrollListeners();

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
    
    // 确保初始状态下所有项目都可见，并将速写项目移到最后
    const portfolioContainer = portfolioItems[0]?.parentNode;
    if (portfolioContainer) {
        const sketchItems = Array.from(portfolioItems).filter(item => 
            item.dataset.category.includes('sketch')
        );
        
        // 将速写项目移到最后，并将它们添加到个人作品类别中
        sketchItems.forEach(item => {
            // 将速写项目添加到个人作品类别
            if (!item.dataset.category.includes('personal')) {
                item.dataset.category = item.dataset.category + ' personal';
            }
            
            // 将速写项目移到最后
            portfolioContainer.appendChild(item);
        });
        
        // 设置所有项目为可见
        portfolioItems.forEach(item => {
            item.style.display = 'block';
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
        });
    }
    
    portfolioTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有标签的active类
            portfolioTabs.forEach(t => t.classList.remove('active'));
            // 给当前点击的标签添加active类
            tab.classList.add('active');
            
            const category = tab.dataset.category;
            
            // 处理所有类别，包括速写类别
            portfolioItems.forEach(item => {
                if (category === 'all' || item.dataset.category.includes(category)) {
                    // 显示匹配的项目
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    // 隐藏不匹配的项目
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 500);
                }
            });
            
            // 更新作品编号
            updatePortfolioNumbers();
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
            // 如果点击的是视频容器，不打开模态框
            if (e.target.closest('.video-container')) {
                return;
            }
            
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
            
            // 特别处理第13个作品（Maya 3D建模）
            if (overlayTitle === 'Maya 3D建模') {
                modalGallery.innerHTML = `
                    <div class="modal-image-container">
                        <img src="image/school/maya.png" alt="Maya 3D建模" class="full-width-image">
                        <h3>Maya 3D白模展示</h3>
                    </div>
                    <div class="modal-video-container">
                        <video src="image/sketch/WeChat_20250303101335.mp4" controls poster="image/sketch/WeChat_20250303101335.mp4#t=99999">
                            <source src="image/sketch/WeChat_20250303101335.mp4" type="video/mp4">
                        </video>
                        <h3>Maya 3D建模演示</h3>
                        <div class="dream-story">
                            <p>这是一个关于学生的梦境。在梦中，他打开电脑，屏幕上全是中国过年的欢乐画面。温暖的红色、喜庆的灯笼、热闹的鞭炮声，一切都那么真实。但就在这时，闹钟突然响起，他才发现之前的一切都是梦境，现在要起床去上学了。</p>
                        </div>
                    </div>
                `;
                
                modalDescription.innerHTML = `
                    <h3>项目背景</h3>
                    <p>这是3D建模课程的作业，使用Maya软件创建和渲染3D模型。同时展示了相关的建模过程。</p>
                    
                    <h3>技术要点</h3>
                    <p>在这个项目中，我学习了多边形建模、UV贴图、材质设置和灯光渲染等Maya核心功能，创建了这个3D场景。</p>
                    
                    <h3>创作过程</h3>
                    <p>从基础几何体开始，通过细化、雕刻和纹理绘制，逐步完善模型细节。最后通过精心设置的灯光和渲染参数，呈现出最终效果。项目中还包含了完整的建模过程演示。</p>
                `;
            } else {
                // 其他作品的处理保持不变
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
                            <h3>设计理念</h3>
                            <p>这是一个3D和人物练习项目，通过结合3D建模和数字绘画来创作一个完整的场景。</p>
                            
                            <h3>技术实现</h3>
                            <p>我的室友首先使用3D软件建模制作了一个钢琴模型，然后将其导入到Photoshop中。在PS中进行了场景的细化处理，添加了人物形象，并通过光影和色彩的调整，营造出温暖而富有艺术感的氛围。</p>
                        `;
                        break;
                        
                    case '未知新球':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/personal/personal project.jpg" alt="未知新球" class="full-width-image">
                                <div class="image-caption">未来科技概念场景</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>项目背景</h3>
                            <p>这是一个未来科技概念场景设计项目，探索了一个神秘的未知星球。</p>
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
                        
                    case '废弃小镇':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/personal/废弃小镇.png" alt="废弃小镇" class="full-width-image">
                                <div class="image-caption">废弃小镇概念设计</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>项目背景</h3>
                            <p>这是我的个人环境概念设计项目，探索被遗弃的城镇空间所蕴含的故事与情感。</p>
                            
                            <h3>设计理念</h3>
                            <p>通过这个作品，我想表达时间流逝和人类活动痕迹的美学。废弃的建筑与逐渐侵蚀的自然元素形成了一种独特的视觉张力，引发观者对过去与未来的思考。</p>
                            
                            <h3>技术实现</h3>
                            <p>在创作过程中，我特别注重光影的处理和氛围的营造，通过精细的细节和纹理表现，赋予这个废弃空间以生命力和故事感。色调的选择也经过精心考量，以增强场景的情感表达。</p>
                        `;
                        break;
                        
                    case '剑仙':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/personal/剑仙.png" alt="剑仙" class="full-width-image">
                                <div class="image-caption">剑仙角色设计</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>项目背景</h3>
                            <p>这是我的个人角色设计项目，灵感来源于中国古典武侠小说中的剑仙形象。</p>
                            
                            <h3>设计理念</h3>
                            <p>我想通过这个角色设计，融合传统东方美学与现代视觉语言，创造一个既有古典韵味又具现代感的剑仙形象。角色的姿态和表情传达了内心的平静与超然，同时蕴含着强大的力量。</p>
                            
                            <h3>创作过程</h3>
                            <p>在设计过程中，我注重服装细节与人物气质的表现，通过精心设计的光效和构图，强调了角色的神秘感和超凡气质。色彩的选择也经过精心考量，以增强整体的视觉冲击力和情感表达。</p>
                        `;
                        break;
                        
                    case '森林':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/personal/森林.png" alt="森林" class="full-width-image">
                                <div class="image-caption">神秘森林概念设计</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>项目背景</h3>
                            <p>这是我的个人环境概念设计项目，探索神秘森林的视觉表现与氛围营造。</p>
                            
                            <h3>设计理念</h3>
                            <p>通过这个作品，我想表达自然的神秘与生命力。茂密的植被、独特的光线和雾气的处理，共同创造出一个既梦幻又真实的森林世界，引导观者进入一个充满想象的空间。</p>
                            
                            <h3>技术实现</h3>
                            <p>在创作过程中，我特别关注光线穿透树叶的效果和空间层次感的表现。通过精细的笔触和色彩渐变，营造出深邃而又充满活力的森林氛围，让观者能够感受到自然的神秘与宁静。</p>
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
            }
            
            // 显示模态框
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        });
    });

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

    // 添加全局变量来跟踪樱花状态
    let sakuraVisible = true;

    // 修改滚动监听部分，确保在滚动到作品集部分时樱花消失
    window.addEventListener('scroll', () => {
        // 获取作品集部分的位置
        const portfolioSection = document.querySelector('#portfolio');
        if (portfolioSection) {
            const portfolioPosition = portfolioSection.getBoundingClientRect().top;
            const screenPosition = window.innerHeight * 0.7; // 当作品集部分进入视口的70%位置时
            
            // 获取樱花容器
            const sakuraContainer = document.querySelector('.sakura-container');
            
            // 如果滚动到作品集部分，则淡出并最终移除樱花效果
            if (portfolioPosition < screenPosition) {
                if (sakuraContainer && sakuraVisible) {
                    sakuraVisible = false;
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
                // 如果向上滚动离开作品集部分，且樱花容器不存在，则重新创建
                if (!sakuraContainer && !sakuraVisible && isHomePage()) {
                    sakuraVisible = true;
                    // 重新创建樱花效果
                    showCherryBlossoms();
                }
            }
        }
        
        // ... existing scroll event code ...
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
    
    // 处理微信二维码弹窗
    const wechatLink = document.getElementById('wechat-link');
    const wechatModal = document.getElementById('wechat-modal');
    const closeWechat = document.querySelector('.close-wechat');
    
    if (wechatLink && wechatModal) {
        // 点击微信图标显示弹窗
        wechatLink.addEventListener('click', (e) => {
            e.preventDefault();
            wechatModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        });
        
        // 点击关闭按钮隐藏弹窗
        if (closeWechat) {
            closeWechat.addEventListener('click', () => {
                wechatModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // 恢复滚动
            });
        }
        
        // 点击弹窗外部区域关闭弹窗
        window.addEventListener('click', (e) => {
            if (e.target === wechatModal) {
                wechatModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // 添加动态更新作品编号的函数
    function updatePortfolioNumbers() {
        // 获取所有当前可见的作品项目
        const visibleItems = document.querySelectorAll('.portfolio-item:not([style*="display: none"])');
        
        // 为每个可见项目重新分配编号
        visibleItems.forEach((item, index) => {
            const numberElement = item.querySelector('.portfolio-number');
            if (numberElement) {
                numberElement.textContent = index + 1;
            }
        });
    }

    // 获取作品集容器
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (portfolioGrid) {
        // 重新排序作品项目，确保它们按照我们想要的顺序显示
        const portfolioItems = Array.from(portfolioGrid.querySelectorAll('.portfolio-item'));
        
        // 清空容器
        portfolioGrid.innerHTML = '';
        
        // 按照类别重新添加项目
        // 首先添加个人作品（不包括速写视频）
        portfolioItems.filter(item => 
            item.getAttribute('data-category').includes('personal') && 
            !item.getAttribute('data-category').includes('sketch')
        ).forEach(item => portfolioGrid.appendChild(item));
        
        // 然后添加学校作品
        portfolioItems.filter(item => item.getAttribute('data-category').includes('school'))
            .forEach(item => portfolioGrid.appendChild(item));
        
        // 最后添加速写视频
        portfolioItems.filter(item => item.getAttribute('data-category').includes('sketch'))
            .forEach(item => portfolioGrid.appendChild(item));
        
        // 更新编号
        updatePortfolioNumbers();
    }

    // 初始化魔法阵粒子
    if (document.querySelector('.intro-circle')) {
        createMagicParticles();
    }

    // 魔法阵粒子效果
    function createMagicParticles() {
        const particles = document.createElement('div');
        particles.className = 'particles';
        document.querySelector('.intro-circle').appendChild(particles);
        
        // 创建20个粒子
        for (let i = 0; i < 20; i++) {
            createParticle(particles);
        }
    }

    function createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机位置
        const angle = Math.random() * Math.PI * 2;
        const radius = 150 + Math.random() * 100; // 在魔法阵周围
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // 设置初始位置
        particle.style.left = `calc(50% + ${x}px)`;
        particle.style.top = `calc(50% + ${y}px)`;
        
        // 随机大小
        const size = 2 + Math.random() * 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // 随机透明度
        particle.style.opacity = 0.3 + Math.random() * 0.7;
        
        // 添加到容器
        container.appendChild(particle);
        
        // 开始动画
        animateParticle(particle);
    }

    function animateParticle(particle) {
        // 随机移动方向和距离
        const moveX = -50 + Math.random() * 100;
        const moveY = -50 + Math.random() * 100;
        
        // 随机动画持续时间
        const duration = 3 + Math.random() * 4;
        
        // 设置CSS变量用于动画
        particle.style.setProperty('--move-x', `${moveX}px`);
        particle.style.setProperty('--move-y', `${moveY}px`);
        
        // 设置动画
        particle.style.animation = `floatParticle ${duration}s infinite alternate`;
        
        // 随机延迟
        particle.style.animationDelay = `${Math.random() * 2}s`;
    }

    // 检查是否是首页
    function isHomePage() {
        return window.location.pathname === '/' || 
               window.location.pathname === '/index.html' || 
               window.location.href.endsWith('index.html') ||
               window.location.pathname.endsWith('/');
    }

    // 樱花动画函数
    function showCherryBlossoms() {
        // 检查是否有樱花容器元素
        let cherryContainer = document.querySelector('.sakura-container');
        
        // 如果不存在，创建一个新的
        if (!cherryContainer) {
            cherryContainer = document.createElement('div');
            cherryContainer.className = 'sakura-container';
            document.body.appendChild(cherryContainer);
        } else {
            // 如果存在，清除现有樱花
            cherryContainer.innerHTML = '';
            // 清除之前的定时器
            if (cherryContainer.dataset.intervalId) {
                clearInterval(parseInt(cherryContainer.dataset.intervalId));
            }
        }
        
        // 确保容器可见
        cherryContainer.style.opacity = '1';
        cherryContainer.style.display = 'block';
        
        // 创建樱花
        function createSakura() {
            const sakura = document.createElement('div');
            sakura.className = 'sakura';
            sakura.innerHTML = '❀';
            sakura.style.left = Math.random() * 100 + 'vw';
            sakura.style.fontSize = Math.random() * 10 + 10 + 'px';
            sakura.style.animationDuration = Math.random() * 10 + 10 + 's';
            cherryContainer.appendChild(sakura);
            
            // 动画结束后移除
            setTimeout(() => {
                if (sakura && sakura.parentNode) {
                    sakura.remove();
                }
            }, 20000);
        }
        
        // 初始创建一些樱花
        for (let i = 0; i < 10; i++) {
            setTimeout(createSakura, 300 * i);
        }
        
        // 持续创建樱花，但限制数量和频率
        const sakuraInterval = setInterval(() => {
            // 如果樱花数量超过30个，则不再创建
            if (cherryContainer.children.length < 30) {
                createSakura();
            }
        }, 2000); // 降低创建频率
        
        // 保存interval ID以便需要时清除
        cherryContainer.dataset.intervalId = sakuraInterval;
        
        return cherryContainer;
    }

    // 页面加载时
    document.addEventListener('DOMContentLoaded', function() {
        // 如果是首页，重置樱花动画状态并显示樱花
        if (isHomePage()) {
            // 重置樱花动画状态
            sessionStorage.removeItem('hasSeenIntro');
            
            // 显示樱花动画
            showCherryBlossoms();
        }
        
        // 汉堡菜单功能
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        const navLinks = document.querySelector('.nav-links');
        const menuOverlay = document.querySelector('.menu-overlay');
        
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', function() {
                // 切换汉堡菜单激活状态
                this.classList.toggle('active');
                // 切换导航菜单显示状态
                navLinks.classList.toggle('active');
                // 切换背景遮罩
                if (menuOverlay) {
                    menuOverlay.classList.toggle('active');
                }
                // 防止滚动
                if (navLinks.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            });
        }
        
        // 点击遮罩关闭菜单
        if (menuOverlay) {
            menuOverlay.addEventListener('click', function() {
                if (hamburgerMenu) hamburgerMenu.classList.remove('active');
                if (navLinks) navLinks.classList.remove('active');
                this.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // 点击导航链接关闭菜单
        const navItems = document.querySelectorAll('.nav-links a');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                if (hamburgerMenu) hamburgerMenu.classList.remove('active');
                if (navLinks) navLinks.classList.remove('active');
                if (menuOverlay) menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    });
});

