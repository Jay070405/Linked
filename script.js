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
            
            // 输出调试信息
            console.log('点击的作品:', overlayTitle);
            console.log('alt文本:', altText);
            console.log('图片路径:', imgElement.getAttribute('src'));
            
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
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
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
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
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
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
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
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
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
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
                            <p>这是环境设计课程的作业，要求运用透视原理创建具有空间感和深度的场景。通过这个项目，我学习了解人物和场景大小关系，并利用SketchUp这个3D软件来确认船的透视。在获取3D船模型的基础上，我设计了自己的概念，最终完成了这幅作品。</p>
                            
                            <h3>设计理念</h3>
                            <p>我创作了这个未来城市场景，表现了一个绝大部分人们都被统治的世界。通过精确的透视关系和光影处理，营造出既宏大又压抑的视觉体验。</p>
                            
                            <h3>技术挑战</h3>
                            <p>项目中最大的挑战是处理复杂的透视关系和多点光源。通过反复研究和实践，结合SketchUp软件的辅助，我成功地解决了这些问题，使画面既符合透视规律又具有艺术表现力。</p>
                        `;
                        break;
                    
                    case '创意透视流程':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/creative prespetive (3).png" alt="创意透视草图阶段" class="full-width-image">
                                <div class="image-caption">过程 - 初期草图</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/creative prespetvie (2).png" alt="创意透视中期阶段" class="full-width-image">
                                <div class="image-caption">过程 - 线稿完善</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/creative prespetvie.png" alt="创意透视最终作品" class="full-width-image">
                                <div class="image-caption">最终渲染</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                            <p>这个项目的要求是使用5点透视技术创作一个场景。我选择了设计一个赛博朋克风格的未来世界，通过精确的透视关系展现出宏大的城市景观。</p>
                            
                            <h3>创意透视流程展示</h3>
                            <p>这个项目展示了创意透视作品从初期草图到最终渲染的完整流程。通过三个关键阶段的展示，可以清晰地看到作品的演变过程。</p>
                            
                            <h3>技术要点</h3>
                            <p>我运用了5点透视技术，将建筑元素通过精确的扭曲和变形创造出视觉冲击力。为了表现人物在这个宏大场景中的比例，我特意设计了火车上的两个角色，让观众能够直观地感受到环境的庞大规模。从初期草图的构思，到线稿的精确处理，再到最终的细节渲染，每一步都展示了不同的技术运用。</p>
                        `;
                        break;
                        
                    case '视觉开发全集':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/vis_dev_character.png" alt="角色设计" class="full-width-image">
                                <div class="image-caption">角色设计</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/vis_dev_prop.png" alt="道具设计" class="full-width-image">
                                <div class="image-caption">道具设计</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/vis_dev_vehicle.png" alt="载具设计" class="full-width-image">
                                <div class="image-caption">载具设计</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/enviroment 1.png" alt="环境设计 1" class="full-width-image">
                                <div class="image-caption">环境设计 1</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/enviroment 2.png" alt="环境设计 2" class="full-width-image">
                                <div class="image-caption">环境设计 2</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/enviroment 3.png" alt="环境设计 3" class="full-width-image">
                                <div class="image-caption">环境设计 3</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/enviroment 4.png" alt="环境设计 4" class="full-width-image">
                                <div class="image-caption">环境设计 4</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>视觉开发全集 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2025年</span></h3>
                            <p>这是我在视觉开发课程中完成的一系列作品，包括角色设计、道具设计、载具设计和多个环境设计作业。</p>
                            
                            <h3>设计理念</h3>
                            <p>在这个系列中，我尝试创建一个连贯的视觉风格，每个设计元素都支持整体世界观的构建。从角色、道具到环境，我注重细节、功能性和美学的统一。</p>
                            
                            <h3>技术实现</h3>
                            <p>作品采用了多种技法和工具，包括数字绘画、3D辅助和概念设计方法。我特别关注光影处理、材质表现和空间构成，确保设计既具有视觉吸引力又符合实际功能需求。</p>
                        `;
                        break;
                        
                    case '视觉开发':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/vis dev.jpg" alt="视觉开发" class="full-width-image">
                                <div class="image-caption">视觉开发作品 1</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/vis dev 3.jpg" alt="视觉开发 3" class="full-width-image">
                                <div class="image-caption">视觉开发作品 2</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/vis dev 4.jpg" alt="视觉开发 4" class="full-width-image">
                                <div class="image-caption">视觉开发作品 3</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/vis dev 5.jpg" alt="视觉开发 5" class="full-width-image">
                                <div class="image-caption">视觉开发作品 4</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
                            <p>这是视觉开发课程的作业，要求选择一部电影，并为其设计一系列道具。</p>
                            
                            <h3>设计理念</h3>
                            <p>在这个项目中，我为选定的电影设计了多种不同的道具。最大的挑战是确保所有道具在风格上保持统一性，使它们看起来像是来自同一个世界观，符合电影的整体美学和氛围。</p>
                            
                            <h3>工作流程</h3>
                            <p>我首先分析了电影的视觉风格和色彩方案，然后设计了多个概念草图。通过反复修改和调整，确保每个道具既有独特性又与整体风格协调一致，最终呈现出一套风格统一的道具设计。</p>
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
                            <h3>设计理念 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                            <p>这是一个3D和人物练习项目，通过结合3D建模和数字绘画来创作一个完整的场景。</p>
                            
                            <h3>技术实现</h3>
                            <p>我首先使用3D软件建模制作了一个钢琴模型，然后将其导入到Photoshop中。在PS中进行了场景的细化处理，添加了人物形象，并通过光影和色彩的调整，营造出温暖而富有艺术感的氛围。</p>
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
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
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
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
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
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                            <p>这是我的个人概念设计项目，探索世界树这一神话元素在现代视觉语言中的表达。</p>
                            
                            <h3>设计理念</h3>
                            <p>世界树在许多文化中都是连接天地的象征。在这个作品中，我尝试将这一古老概念与魔法元素结合，创造出一个既神秘又宏大的视觉形象。</p>
                            
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
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
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
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
                            <p>这是我的个人环境概念设计项目，探索被遗弃的城镇空间所蕴含的故事与情感。</p>
                            
                            <h3>设计理念</h3>
                            <p>通过这个作品，我想表达时间流逝和人类活动痕迹的美学。废弃的建筑与逐渐侵蚀的自然元素形成了一种独特的视觉张力，引发观者对过去与未来的思考。</p>
                            
                            <h3>技术实现</h3>
                            <p>在创作过程中，我特别注重光影的处理和氛围的营造，通过精细的细节和纹理表现，赋予这个废弃空间以生命力和故事感。色调的选择也经过精心考量，以增强场景的情感表达。</p>
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
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
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
                            <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                            <p>这是我的速写创作过程记录，展示了从构思到完成的整个绘画流程。</p>
                            
                            <h3>创作方法</h3>
                            <p>视频记录了我的数字绘画过程，包括线稿绘制、基础上色、细节刻画和最终效果调整等阶段。</p>
                            
                            <h3>技术要点</h3>
                            <p>在创作过程中，我运用了多种数字绘画技巧，包括图层管理、画笔技法和色彩调整等，展示了专业数字艺术工作流程。</p>
                        `;
                        break;
                        
                    case '角色素描':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/sketching for entd.png" alt="角色设计素描" class="full-width-image">
                                <div class="image-caption">角色设计</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/sketching for entd (2).png" alt="动作和表情素描" class="full-width-image">
                                <div class="image-caption">动作和表情研究</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>角色素描研究 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                            <p>这个项目展示了角色设计和动作表情研究的素描过程。通过素描深入研究角色的外观特征以及动态姿态，为后续的角色创作奠定基础。</p>
                            
                            <h3>设计要点</h3>
                            <p>项目包含两个主要部分：角色整体设计和动作表情细节研究。通过对角色比例、服装和特征的精确素描，以及对各种表情和动作姿态的探索，全面展示了角色设计的基础工作。</p>
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

    // 全局通用翻译对象
    const globalTranslations = {
        'zh': {
            'nav-home': '首页',
            'nav-about': '关于我',
            'nav-portfolio': '作品集',
            'nav-contact': '联系方式',
            'resume-cn': '简历(中文)',
            'resume-en': 'Resume(EN)',
            'contact-title': 'CONTACT ME',
            'contact-content': '若您对我的作品感兴趣，或有任何合作机会，请点击下方按钮了解更多联系方式',
            'thanks-title': '感谢',
            'thanks-content': '感谢您的留言，我会尽快回复。',
            'back-home': '返回首页',
            'about-title': '关于我',
            'about-content': '我是一名充满热情的数字艺术家，专注于概念设计和插画创作。我的作品融合了传统艺术与数字技术，致力于创造独特的视觉体验。',
            'project-details': '项目详情',
            'portfolio-title': '作品集',
            'tab-all': '全部',
            'tab-personal': '个人作品',
            'tab-school': '学校作品',
            'tab-sketch': '速写',
            'hero-greeting': '你好，我是 <span class="highlight">Shijie Lin</span>',
            'hero-subtitle1': '插画师',
            'hero-subtitle2': '虚拟开发',
            'hero-subtitle3': '概念设计师',
            'hero-cta': '查看我的作品',
            'intro-button': '进入作品集',
            'view-portfolio': '查看我的作品集',
            // 技能展示区域翻译
            'skills-showcase-title': '我的专业领域',
            'design-process-title': '设计流程',
            'design-process-desc': '从概念构思到最终作品，我的设计流程注重细节与创新。每个项目都经过充分研究、草图探索、迭代优化和精细执行，确保作品既满足功能需求又具备艺术价值。',
            'technical-skills-title': '专业技能',
            'technical-skills-desc': '熟练运用数字绘画技术与3D建模工具，将创意转化为视觉作品。精通透视、色彩理论和构图原则，能够在不同艺术风格间自如转换，为项目带来独特的视觉表达。',
            'creative-philosophy-title': '创作理念',
            'creative-philosophy-desc': '我相信艺术是连接情感与想象的桥梁。我的创作融合东西方美学，注重叙事性与氛围营造，通过细节与象征元素赋予作品层次感和共鸣，让观者在视觉体验中产生情感连接。',
            'years-experience': '年专业经验',
            'completed-projects': '完成项目',
            'client-satisfaction': '客户满意度',
            // 关于页面新增翻译
            'about-intro': '我是林世杰，ArtCenter College of Design 娱乐设计专业在读生，专注游戏与影视领域的角色/场景概念设计，会用3D建模（Blender/Maya）与数字绘画（Photoshop/Procreate）融合，曾为商业项目提升视觉辨识度并实现100%交付满意度。希望你会喜欢我的作品。',
            'about-title-role': '概念艺术家 / 视觉叙事设计师',
            'about-location': '📍 上海 · Los Angeles | 🎓 ArtCenter College of Design 在读',
            'about-traits-title': '🌟 个人特质',
            'trait-1': '快速学习者',
            'trait-2': '热爱探索新技术',
            'trait-3': '创意思维活跃',
            'trait-4': '游戏文化爱好者',
            'trait-5': '娱乐产业研究者',
            'trait-6': '跨媒体创作者',
            'services-title': '🎯 专业服务',
            'service-1-title': '角色/场景概念设计',
            'service-1-desc': '专注于创造独特而富有生命力的角色与场景设计',
            'service-2-title': '世界观视觉开发',
            'service-2-desc': '擅长融合东方传统美学与现代数字技术',
            'service-3-title': '创意设计协作',
            'service-3-desc': '追求高品质的视觉呈现与艺术创新',
            'skills-title': '🛠️ 技能专长',
            'software-title': '软件工具',
            'art-skills-title': '艺术技能',
            'art-skill-1': '数字绘画',
            'art-skill-2': '3D建模',
            'art-skill-3': '视觉叙事',
            'art-skill-4': '色彩理论',
            'achievements-title': '🏆 主要成就',
            'achievement-1': 'ArtCenter Merit 奖学金获得者',
            'achievement-2': '个人插画委托项目 100%满意度交付',
            'achievement-3': '原创角色设计入选校级艺术展览',
            'portfolio-title': '作品集',
            'tab-all': '全部',
            'tab-personal': '个人作品',
            'tab-school': '学校作品',
            'tab-sketch': '速写',
            'back-home': '返回主页',
            'project-details': '项目详情',
            
            // 作品项目标题和描述
            'artist-title': '艺术家',
            'artist-desc': '原创角色设计',
            'unknown-sphere-title': '未知新球',
            'unknown-sphere-desc': '未来科技概念场景',
            'sakura-village-title': '樱花村',
            'sakura-village-desc': '环境概念设计',
            'world-tree-title': '世界树',
            'world-tree-desc': '概念设计',
            'temple-title': '寺庙',
            'temple-desc': '建筑概念设计',
            'abandoned-town-title': '废弃小镇',
            'abandoned-town-desc': '个人概念设计作品',
            'mysterious-forest-title': '神秘森林',
            'mysterious-forest-desc': '个人环境设计作品',
            'vis-dev-title': '视觉开发全集',
            'vis-dev-desc': '角色、道具与环境',
            'creative-perspective-title': '创意透视流程',
            'creative-perspective-desc': '从草图到最终作品',
            'character-sketch-title': '角色素描',
            'character-sketch-desc': '设计与动作表情研究',
            'bg-painting-title': '背景绘画',
            'bg-painting-desc': 'ArtCenter 课程作业',
            'creative-perspective-simple-title': '创意透视',
            'creative-perspective-simple-desc': '环境设计课程作业',
            'maya-3d-title': 'Maya 3D建模',
            'maya-3d-desc': '3D建模课程作业',
            'vis-dev-simple-title': '视觉开发',
            'vis-dev-simple-desc': '视觉开发课程作业',
            'cat-diary-title': '猫咪日记',
            'cat-diary-desc': '角色设计课程作业',
            'photoshop-basics-title': 'Photoshop基础',
            'photoshop-basics-desc': '数字绘画课程作业',
            'sketch-video1-title': '速写过程1',
            'sketch-video1-desc': '创作过程记录',
            'sketch-video2-title': '速写过程2',
            'sketch-video2-desc': '创作过程记录',
        },
        'en': {
            'nav-home': 'Home',
            'nav-about': 'About',
            'nav-portfolio': 'Portfolio',
            'nav-contact': 'Contact',
            'resume-cn': 'Resume(CN)',
            'resume-en': 'Resume(EN)',
            'contact-title': 'CONTACT ME',
            'contact-content': 'If you are interested in my work or have any collaboration opportunities, please click the button below to learn more about how to contact me.',
            'thanks-title': 'Thank You',
            'thanks-content': 'Thank you for your message. I will get back to you soon.',
            'back-home': 'Back to Home',
            'about-title': 'About Me',
            'about-content': 'I am a passionate digital artist focused on concept design and illustration. My work combines traditional art with digital technology, creating unique visual experiences.',
            'project-details': 'Project Details',
            'portfolio-title': 'Portfolio',
            'tab-all': 'All',
            'tab-personal': 'Personal Works',
            'tab-school': 'School Projects',
            'tab-sketch': 'Sketches',
            'hero-greeting': 'Hello, I am <span class="highlight">Shijie Lin</span>',
            'hero-subtitle1': 'Illustrator',
            'hero-subtitle2': 'Virtual Developer',
            'hero-subtitle3': 'Concept Designer',
            'hero-cta': 'View My Work',
            'intro-button': 'Enter Portfolio',
            'view-portfolio': 'View My Portfolio',
            // Skills showcase translations
            'skills-showcase-title': 'My Expertise',
            'design-process-title': 'Design Process',
            'design-process-desc': 'From concept to final artwork, my design process emphasizes detail and innovation. Each project undergoes thorough research, sketch exploration, iterative refinement, and meticulous execution to ensure both functional requirements and artistic value.',
            'technical-skills-title': 'Technical Skills',
            'technical-skills-desc': 'Proficient in digital painting techniques and 3D modeling tools, I transform creative ideas into visual works. Mastering perspective, color theory, and composition principles, I navigate different artistic styles to bring unique visual expressions to projects.',
            'creative-philosophy-title': 'Creative Philosophy',
            'creative-philosophy-desc': 'I believe art bridges emotions and imagination. My work blends Eastern and Western aesthetics, focusing on narrative and atmosphere. Through details and symbolic elements, I create depth and resonance, fostering emotional connections with viewers.',
            'years-experience': 'Years Experience',
            'completed-projects': 'Projects Completed',
            'client-satisfaction': 'Client Satisfaction',
            // About page new translations
            'about-intro': 'I am Shijie Lin, an Entertainment Design student at ArtCenter College of Design, focusing on character/environment concept design for games and film. I combine 3D modeling (Blender/Maya) with digital painting (Photoshop/Procreate), and have achieved 100% satisfaction on commercial project deliveries. I hope you enjoy my work.',
            'about-title-role': 'Concept Artist / Visual Storyteller',
            'about-location': '📍 Shanghai · Los Angeles | 🎓 Studying at ArtCenter College of Design',
            'about-traits-title': '🌟 Personal Traits',
            'trait-1': 'Fast Learner',
            'trait-2': 'Tech Explorer',
            'trait-3': 'Creative Thinker',
            'trait-4': 'Gaming Enthusiast',
            'trait-5': 'Entertainment Industry Researcher',
            'trait-6': 'Cross-media Creator',
            'services-title': '🎯 Professional Services',
            'service-1-title': 'Character/Environment Concept Design',
            'service-1-desc': 'Creating unique and vibrant character and environment designs',
            'service-2-title': 'World-building Visual Development',
            'service-2-desc': 'Blending Eastern traditional aesthetics with modern digital technology',
            'service-3-title': 'Creative Design Collaboration',
            'service-3-desc': 'Pursuing high-quality visual presentation and artistic innovation',
            'skills-title': '🛠️ Skills & Expertise',
            'software-title': 'Software Tools',
            'art-skills-title': 'Art Skills',
            'art-skill-1': 'Digital Painting',
            'art-skill-2': '3D Modeling',
            'art-skill-3': 'Visual Storytelling',
            'art-skill-4': 'Color Theory',
            'achievements-title': '🏆 Key Achievements',
            'achievement-1': 'ArtCenter Merit Scholarship Recipient',
            'achievement-2': '100% Satisfaction Rate on Personal Illustration Commissions',
            'achievement-3': 'Original Character Design Selected for School Art Exhibition',
            'portfolio-title': 'Portfolio',
            'tab-all': 'All',
            'tab-personal': 'Personal',
            'tab-school': 'School',
            'tab-sketch': 'Sketches',
            'back-home': 'Back to Home',
            'project-details': 'Project Details',
            
            // 作品项目标题和描述（英文）
            'artist-title': 'Artist',
            'artist-desc': 'Original Character Design',
            'unknown-sphere-title': 'Unknown Sphere',
            'unknown-sphere-desc': 'Futuristic Concept Scene',
            'sakura-village-title': 'Sakura Village',
            'sakura-village-desc': 'Environmental Concept Design',
            'world-tree-title': 'World Tree',
            'world-tree-desc': 'Concept Design',
            'temple-title': 'Temple',
            'temple-desc': 'Architectural Concept Design',
            'abandoned-town-title': 'Abandoned Town',
            'abandoned-town-desc': 'Personal Concept Design',
            'mysterious-forest-title': 'Mysterious Forest',
            'mysterious-forest-desc': 'Personal Environment Design',
            'vis-dev-title': 'Visual Development Collection',
            'vis-dev-desc': 'Characters, Props & Environments',
            'creative-perspective-title': 'Creative Perspective Process',
            'creative-perspective-desc': 'From Sketch to Final Work',
            'character-sketch-title': 'Character Sketches',
            'character-sketch-desc': 'Design & Expression Studies',
            'bg-painting-title': 'Background Painting',
            'bg-painting-desc': 'ArtCenter Course Assignment',
            'creative-perspective-simple-title': 'Creative Perspective',
            'creative-perspective-simple-desc': 'Environment Design Course',
            'maya-3d-title': 'Maya 3D Modeling',
            'maya-3d-desc': '3D Modeling Course Project',
            'vis-dev-simple-title': 'Visual Development',
            'vis-dev-simple-desc': 'Visual Development Course',
            'cat-diary-title': 'Cat Diary',
            'cat-diary-desc': 'Character Design Course',
            'photoshop-basics-title': 'Photoshop Fundamentals',
            'photoshop-basics-desc': 'Digital Painting Course',
            'sketch-video1-title': 'Sketching Process 1',
            'sketch-video1-desc': 'Creation Process Recording',
            'sketch-video2-title': 'Sketching Process 2',
            'sketch-video2-desc': 'Creation Process Recording',
        }
    };

    // 统一的翻译更新函数
    function updateAllTranslations() {
        // 从本地存储获取当前语言设置
        const currentLang = localStorage.getItem('preferredLanguage') || 'zh';
        console.log('应用全局翻译 - 当前语言:', currentLang);
        
        // 翻译所有有data-translate属性的元素
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (globalTranslations[currentLang] && globalTranslations[currentLang][key]) {
                // 如果包含HTML，使用innerHTML，否则使用textContent
                if (globalTranslations[currentLang][key].includes('<')) {
                    element.innerHTML = globalTranslations[currentLang][key];
                } else {
                    element.textContent = globalTranslations[currentLang][key];
                }
                console.log(`已翻译: ${key} -> ${globalTranslations[currentLang][key].substring(0, 15)}${globalTranslations[currentLang][key].length > 15 ? '...' : ''}`);
            }
        });
        
        // 更新所有语言按钮的状态
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === currentLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // 确保语言设置在整个网站保持一致
    function initTranslation() {
        // 从本地存储获取当前语言设置
        const currentLang = localStorage.getItem('preferredLanguage') || 'zh';
        console.log('初始化翻译 - 检测到语言:', currentLang);

        // 设置HTML语言属性
        document.documentElement.lang = currentLang;
        
        // 立即应用翻译
        updateAllTranslations();
        
        // 设置所有语言按钮状态
        document.querySelectorAll('.lang-btn').forEach(btn => {
            // 清除所有之前的事件监听器
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // 设置活动状态
            if (newBtn.getAttribute('data-lang') === currentLang) {
                newBtn.classList.add('active');
            } else {
                newBtn.classList.remove('active');
            }
            
            // 添加新的事件监听器
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const lang = this.getAttribute('data-lang');
                console.log(`点击语言按钮: ${lang}`);
                
                // 保存语言设置
                localStorage.setItem('preferredLanguage', lang);
                
                // 刷新页面以应用新语言
                window.location.reload();
                
                return false;
            });
        });
    }

    // 在DOM加载完成后立即初始化翻译
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTranslation);
    } else {
        // 如果DOM已经加载完成，立即执行
        initTranslation();
    }

    // 为了确保翻译在完全加载后正确应用
    window.addEventListener('load', function() {
        console.log('Window load: 再次检查并应用翻译');
        // 延迟执行以确保所有DOM元素都已完全加载和渲染
        setTimeout(updateAllTranslations, 100);
        
        // 添加技能展示区域进度条动画
        const progressBars = document.querySelectorAll('.progress-bar');
        const skillsSection = document.getElementById('skills-showcase');
        
        if (skillsSection && progressBars.length > 0) {
            // 初始化进度条宽度为0
            progressBars.forEach(bar => {
                bar.style.width = '0%';
            });
            
            // 检查元素是否在视口中
            function isElementInViewport(el) {
                const rect = el.getBoundingClientRect();
                return (
                    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.bottom >= 0
                );
            }
            
            // 动画函数
            function animateProgressBars() {
                if (isElementInViewport(skillsSection)) {
                    progressBars.forEach(bar => {
                        const targetWidth = bar.getAttribute('style').split('width:')[1].trim().split('%')[0];
                        bar.style.width = targetWidth + '%';
                    });
                    // 移除滚动监听，避免重复触发
                    window.removeEventListener('scroll', animateProgressBars);
                }
            }
            
            // 添加滚动监听
            window.addEventListener('scroll', animateProgressBars);
            
            // 初始检查
            animateProgressBars();
        }
    });

    // 添加调试函数
    window.forceTranslate = function(lang) {
        if (lang && (lang === 'zh' || lang === 'en')) {
            localStorage.setItem('preferredLanguage', lang);
            updateAllTranslations();
            console.log(`已强制切换语言到: ${lang}`);
        } else {
            console.log('当前语言设置:', localStorage.getItem('preferredLanguage') || 'zh');
            updateAllTranslations();
        }
    };

    // OpenModal函数应该在全局作用域定义，以便在所有页面使用
    function openModal(imageSrc, imageAlt, title, description) {
        console.log('Opening modal for:', title);
        console.log('Image alt:', imageAlt);
        
        // 保存当前项目信息，以便语言切换时重用
        const currentModalInfo = {
            imageSrc: imageSrc,
            imageAlt: imageAlt,
            title: title,
            description: description
        };
        window.currentModalInfo = currentModalInfo;
        
        // 获取全局当前语言
        const currentLang = localStorage.getItem('preferredLanguage') || 'zh';
        console.log('Current language in modal:', currentLang);
        
        const projectModal = document.getElementById('projectModal');
        const modalGallery = document.getElementById('modalGallery');
        const modalDescription = document.getElementById('modalDescription');
        const modalTitle = document.querySelector('.modal-title');
        
        if (!projectModal || !modalGallery || !modalDescription) {
            console.error('Modal elements not found');
            return;
        }
        
        // 清空旧内容
        modalGallery.innerHTML = '';
        modalDescription.innerHTML = '';
        
        // 添加图片或视频
        if (imageSrc) {
            if (imageSrc.includes('.mp4')) {
                // 如果是视频
                const videoContainer = document.createElement('div');
                videoContainer.className = 'modal-video-container';
                
                const video = document.createElement('video');
                video.src = imageSrc;
                video.controls = true;
                
                const poster = imageSrc.includes('#t=') ? imageSrc : imageSrc.replace('.mp4', '.png');
                video.poster = poster;
                
                videoContainer.appendChild(video);
                modalGallery.appendChild(videoContainer);
            } else {
                // 如果是图片
                const img = document.createElement('img');
                img.src = imageSrc;
                img.alt = imageAlt || title;
                img.className = 'full-width-image';
                modalGallery.appendChild(img);
            }
        }
        
        // 创建并添加切换内容按钮（简单直接的解决方案）
        const forceZhButton = document.createElement('button');
        forceZhButton.textContent = '中文内容';
        forceZhButton.style.padding = '8px 15px';
        forceZhButton.style.margin = '10px 5px';
        forceZhButton.style.background = '#2a2a2a';
        forceZhButton.style.color = '#fff';
        forceZhButton.style.border = '1px solid #555';
        forceZhButton.style.borderRadius = '4px';
        forceZhButton.style.cursor = 'pointer';
        forceZhButton.addEventListener('click', function() {
            const key = imageAlt || title;
            const content = getZhContent(key);
            if (content) {
                modalDescription.innerHTML = content;
                console.log('强制切换到中文内容');
            }
        });
        
        const forceEnButton = document.createElement('button');
        forceEnButton.textContent = 'English Version';
        forceEnButton.style.padding = '8px 15px';
        forceEnButton.style.margin = '10px 5px';
        forceEnButton.style.background = '#2a2a2a';
        forceEnButton.style.color = '#fff';
        forceEnButton.style.border = '1px solid #555';
        forceEnButton.style.borderRadius = '4px';
        forceEnButton.style.cursor = 'pointer';
        forceEnButton.addEventListener('click', function() {
            // 关闭当前模态框
            projectModal.style.display = 'none';
            
            // 显示英文版模态框
            openEnglishModal(imageSrc, imageAlt, title, description);
        });
        
        // 添加按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.textAlign = 'center';
        buttonContainer.style.marginBottom = '15px';
        buttonContainer.appendChild(forceZhButton);
        buttonContainer.appendChild(forceEnButton);
        
        // 将按钮添加到模态框
        modalDescription.parentNode.insertBefore(buttonContainer, modalDescription);
        
        // 更新模态框内容的函数
        function updateModalContentWithLanguage(lang) {
            // 更新标题翻译
            if (modalTitle) {
                modalTitle.textContent = lang === 'zh' ? '项目详情' : 'Project Details';
            }
            
            // 清空描述内容，以便重新填充
            modalDescription.innerHTML = '';
            
            // 获取当前项目信息
            const info = window.currentModalInfo || {};
            const key = info.imageAlt || info.title;
            
            console.log('正在渲染内容，键名:', key, '语言:', lang);
            
            let content = null;
            
            // 根据语言选择内容
            if (lang === 'zh') {
                // 中文内容
                if (key) content = getZhContent(key);
            } else {
                // 英文内容
                if (key) {
                    // 1. 尝试直接用键名查找
                    content = getEnContent(key);
                    
                    // 2. 如果找不到，尝试翻译后查找
                    if (!content) {
                        const enKey = translateTitleToEn(key);
                        if (enKey && enKey !== key) {
                            content = getEnContent(enKey);
                            console.log('尝试翻译键名查找:', key, '->', enKey, '结果:', !!content);
                        }
                    }
                }
            }
            
            // 如果找到了内容，显示它
            if (content) {
                modalDescription.innerHTML = content;
                console.log('找到并显示内容');
            } else {
                // 如果没找到内容，使用基本描述
                console.log('未找到内容，使用基本描述');
                
                if (lang === 'zh') {
                    // 中文基本描述
                    modalDescription.innerHTML = `
                        <h3>${info.title || ''} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                        <p>${info.description || '暂无详细描述'}</p>
                    `;
                } else {
                    // 英文基本描述
                    const enTitle = translateTitleToEn(info.title) || info.title || '';
                    const enDesc = translateDescToEn(info.description) || info.description || 'No detailed description available';
                    
                    modalDescription.innerHTML = `
                        <h3>${enTitle} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                        <p>${enDesc}</p>
                    `;
                }
            }
            
            // 更新语言按钮状态
            const zhBtn = document.querySelector('.modal-lang-btn[data-lang="zh"]');
            const enBtn = document.querySelector('.modal-lang-btn[data-lang="en"]');
            
            if (zhBtn && enBtn) {
                if (lang === 'zh') {
                    zhBtn.classList.add('active');
                    enBtn.classList.remove('active');
                } else {
                    zhBtn.classList.remove('active');
                    enBtn.classList.add('active');
                }
            }
        }
        
        // 首次渲染内容
        updateModalContentWithLanguage(currentLang);
        
        // 显示模态框
        projectModal.style.display = 'flex';
        
        // 关闭模态框的点击事件
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.onclick = function() {
                projectModal.style.display = 'none';
                
                // 如果有视频，暂停视频播放
                const videos = projectModal.querySelectorAll('video');
                videos.forEach(video => {
                    video.pause();
                });
            };
        }
        
        // 点击模态框外部关闭
        window.onclick = function(event) {
            if (event.target === projectModal) {
                projectModal.style.display = 'none';
                
                // 如果有视频，暂停视频播放
                const videos = projectModal.querySelectorAll('video');
                videos.forEach(video => {
                    video.pause();
                });
            }
        };
    }

    // 添加一个专门用于显示英文模态框的函数
    function openEnglishModal(imageSrc, imageAlt, title, description) {
        console.log('打开英文模态框:', title);
        
        const enProjectModal = document.getElementById('enProjectModal');
        const enModalGallery = document.getElementById('enModalGallery');
        const enModalDescription = document.getElementById('enModalDescription');
        
        if (!enProjectModal || !enModalGallery || !enModalDescription) {
            console.error('找不到英文模态框元素');
            return;
        }
        
        // 清空旧内容
        enModalGallery.innerHTML = '';
        enModalDescription.innerHTML = '';
        
        // 添加图片或视频
        if (imageSrc) {
            if (imageSrc.includes('.mp4')) {
                // 如果是视频
                const videoContainer = document.createElement('div');
                videoContainer.className = 'modal-video-container';
                
                const video = document.createElement('video');
                video.src = imageSrc;
                video.controls = true;
                
                const poster = imageSrc.includes('#t=') ? imageSrc : imageSrc.replace('.mp4', '.png');
                video.poster = poster;
                
                videoContainer.appendChild(video);
                enModalGallery.appendChild(videoContainer);
            } else {
                // 如果是图片
                const img = document.createElement('img');
                img.src = imageSrc;
                img.alt = imageAlt || title;
                img.className = 'full-width-image';
                enModalGallery.appendChild(img);
            }
        }
        
        // 获取英文内容
        const key = imageAlt || title;
        let enContent = null;
        
        // 尝试直接获取英文内容
        enContent = getEnContent(key);
        
        // 如果找不到，尝试翻译后查找
        if (!enContent) {
            const enKey = translateTitleToEn(key);
            if (enKey && enKey !== key) {
                enContent = getEnContent(enKey);
                console.log('翻译键名获取英文内容:', key, '->', enKey, '结果:', !!enContent);
            }
        }
        
        // 显示内容
        if (enContent) {
            enModalDescription.innerHTML = enContent;
            console.log('找到并显示英文内容');
        } else {
            // 英文基本描述
            const enTitle = translateTitleToEn(title) || title || '';
            const enDesc = translateDescToEn(description) || description || 'No detailed description available';
            
            enModalDescription.innerHTML = `
                <h3>${enTitle} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                <p>${enDesc}</p>
            `;
            console.log('未找到预定义英文内容，显示基本描述');
        }
        
        // 显示英文模态框
        enProjectModal.style.display = 'flex';
        
        // 点击英文模态框外部关闭
        window.addEventListener('click', function(event) {
            if (event.target === enProjectModal) {
                enProjectModal.style.display = 'none';
                
                // 如果有视频，暂停视频播放
                const videos = enProjectModal.querySelectorAll('video');
                videos.forEach(video => {
                    video.pause();
                });
            }
        });
    }

    // 添加模态框语言切换按钮的样式
    document.addEventListener('DOMContentLoaded', function() {
        const style = document.createElement('style');
        style.textContent = `
            .modal-language-selector {
                display: flex;
                position: absolute;
                top: 20px;
                right: 60px;
                z-index: 10;
            }
            .modal-lang-btn {
                background: rgba(30, 30, 35, 0.7);
                color: #89CFF0;
                border: 1px solid rgba(137, 207, 240, 0.3);
                padding: 5px 10px;
                margin-left: 5px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .modal-lang-btn.active {
                background: #89CFF0;
                color: #1a1a1a;
            }
            .modal-lang-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 2px 8px rgba(137, 207, 240, 0.4);
            }
            .modal-content {
                position: relative;
            }
        `;
        document.head.appendChild(style);
    });

    document.addEventListener('DOMContentLoaded', function() {
        // ... 原有代码 ...

        // 在全局作用域检查并注册项目点击事件
        function registerProjectEvents() {
            // 注册作品集项目点击事件（在index页面上）
            const portfolioItems = document.querySelectorAll('.portfolio-item');
            
            if (portfolioItems.length > 0) {
                console.log('Registering click events for', portfolioItems.length, 'portfolio items');
                
                portfolioItems.forEach(item => {
                    // 避免重复添加事件监听器
                    if (!item.hasAttribute('data-event-registered')) {
                        item.setAttribute('data-event-registered', 'true');
                        
                        item.addEventListener('click', function() {
                            const imgElement = this.querySelector('img') || this.querySelector('video');
                            const imgSrc = imgElement?.src;
                            // 确保获取正确的alt文本用于内容识别
                            const imgAlt = imgElement?.alt || imgElement?.getAttribute('data-content-key');
                            const title = this.querySelector('.portfolio-overlay h3').textContent;
                            const desc = this.querySelector('.portfolio-overlay p').textContent;
                            
                            console.log('Opening modal with:', {imgSrc, imgAlt, title, desc});
                            openModal(imgSrc, imgAlt, title, desc);
                        });
                        
                        // 添加cursor-pointer类以显示点击效果
                        item.classList.add('cursor-pointer');
                    }
                });
            }
        }
        
        // 页面加载后执行一次
        registerProjectEvents();
        
        // ... 继续原有代码 ...
    });

    // 添加英文内容获取函数
    function getEnContent(key) {
        console.log("获取英文内容，键名:", key);
        // 根据key返回对应的英文内容HTML
        switch(key) {
            case '艺术家':
            case 'Artist':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This is an original character design project that explores unique artistic styles and character representation.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>This character embodies my artistic style, combining elegance with expressiveness. I aimed to create a character with a strong personality and visual impact, while keeping a sense of mystery and depth.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>I utilized advanced digital painting techniques, focusing on color harmony, lighting, and detailed rendering. The character design process involved extensive research and multiple iterations to achieve the perfect balance between aesthetics and character storytelling.</p>
                `;

            case '未知新球':
            case 'Unknown Sphere':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This is a futuristic concept scene exploring the interaction between technology and natural environments.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>The "Unknown Sphere" concept explores the mystery of advanced technology in natural settings. The design aims to create a sense of wonder and scientific curiosity through the contrast between the organic forest environment and the geometric, technological sphere.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>I focused on creating a realistic lighting scenario with dramatic fog effects to enhance the mysterious atmosphere. The technical challenge involved balancing the organic forest elements with the hard-surface design of the sphere, while maintaining visual coherence through color harmony and atmospheric perspective.</p>
                `;

            case '樱花村':
            case 'Sakura Village':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This environmental concept design depicts a traditional Japanese village during cherry blossom season.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>The "Sakura Village" concept explores the beauty of traditional Japanese architecture harmoniously integrated with the natural environment. I wanted to capture the tranquil and poetic atmosphere of a village during cherry blossom season, emphasizing the cultural significance and aesthetic value of such seasonal moments.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>I carefully constructed the architectural elements following traditional Japanese design principles, while giving special attention to the lighting and atmospheric effects. The pink hues of the cherry blossoms were balanced with the earthy tones of the buildings, creating a harmonious color palette that enhances the emotional impact of the scene.</p>
                `;

            case '世界树':
            case 'World Tree':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This concept design explores the mythological World Tree, blending magical elements with fantasy aesthetics.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>The "World Tree" concept is inspired by various mythologies where a cosmic tree connects different realms of existence. I aimed to create a design that feels both ancient and magical, emphasizing the tree's role as a bridge between worlds through its luminous features and imposing scale.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>I employed advanced lighting techniques to create the ethereal glow emanating from the tree. The composition was carefully planned to emphasize the massive scale of the tree, while intricate details were added to convey its organic and magical nature. The color palette was chosen to enhance the mystical atmosphere of the scene.</p>
                `;

            case '寺庙':
            case 'Temple':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
                    <p>This architectural concept design explores traditional Eastern temple architecture in a contemporary interpretation.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>The temple design is inspired by traditional Eastern sacred architecture, particularly drawing from Chinese and Japanese aesthetic principles. I wanted to create a space that conveys spiritual tranquility while incorporating subtle contemporary design elements that respect the traditional forms.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>The design process involved extensive research on architectural proportions and decorative elements typical in temple construction. Particular attention was paid to the lighting design, using natural light sources to enhance the spatial quality and spiritual atmosphere of the temple. The color palette was deliberately restrained to evoke serenity and contemplation.</p>
                `;

            case '废弃小镇':
            case 'Abandoned Town':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
                    <p>This is a personal environment concept design project, exploring the stories and emotions contained within abandoned urban spaces.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>Through this work, I wanted to express the aesthetics of time passing and traces of human activity. The abandoned buildings and gradually encroaching natural elements create a unique visual tension, prompting viewers to reflect on the past and future.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>During the creation process, I paid special attention to the treatment of light and shadow and the creation of atmosphere. Through detailed textures and careful rendering, I gave this abandoned space life and a sense of story. The choice of color tones was also carefully considered to enhance the emotional expression of the scene.</p>
                `;

            case '森林':
            case 'Mysterious Forest':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2025</span></h3>
                    <p>This is a personal environment concept design project, exploring the visual representation and atmosphere creation of a mysterious forest.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>Through this work, I wanted to express the mystery and vitality of nature. The dense vegetation, unique lighting, and treatment of fog together create a forest world that is both dreamlike and real, guiding viewers into a space full of imagination.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>During the creation process, I focused particularly on the effect of light penetrating through leaves and the expression of spatial layering. Through fine brushwork and color gradients, I created a deep yet vibrant forest atmosphere, allowing viewers to feel the mystery and tranquility of nature.</p>
                `;

            case '视觉开发全集':
            case 'Visual Development Collection':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This project involves selecting a movie and designing a series of props, with the challenge of maintaining a unified style across all designs.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>The key challenge in this project was ensuring stylistic unity across all props. Each item needed to appear as if it belonged to the same world view and aligned with the overall aesthetics of the chosen movie, while still maintaining its unique characteristics and purpose.</p>
                    
                    <h3>Workflow</h3>
                    <p>The process involved analyzing the visual style of the selected movie, creating concept sketches, and ensuring each prop was both unique and cohesive with the overall design. This project demonstrates the ability to maintain consistent design language across multiple items while serving the narrative needs of a larger world-building context.</p>
                `;

            case '创意透视流程':
            case 'Creative Perspective Process':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This project required the use of five-point perspective to create a cyberpunk world scene featuring two characters on a train.</p>
                    
                    <h3>Design Choice</h3>
                    <p>I chose to create a dynamic scene of characters on a futuristic train in a cyberpunk city, utilizing five-point perspective to enhance the dramatic visual impact. This assignment challenged me to apply complex perspective techniques to create an immersive and visually compelling environment.</p>
                    
                    <h3>Technical Points</h3>
                    <p>The project showcases the application of five-point curvilinear perspective, which is particularly effective for creating dramatic wide-angle views. The perspective technique helps create a sense of immersion and depth, while the character placement on the train adds narrative interest and scale reference to the scene. The process from initial sketch to final rendering demonstrates my methodical approach to complex illustration challenges.</p>
                `;

            case '角色素描':
            case 'Character Sketches':
                return `
                    <h3>Character Sketch Study <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This project showcases the sketching process for character design and action/expression studies. Through sketching, I deeply explored the character's appearance features and dynamic postures, laying the foundation for subsequent character creation.</p>
                    
                    <h3>Design Points</h3>
                    <p>The project contains two main parts: overall character design and detailed action/expression studies. Through precise sketching of character proportions, clothing, and features, as well as exploration of various expressions and action postures, it comprehensively demonstrates the fundamental work of character design.</p>
                `;

            case 'Photoshop基础':
            case 'Photoshop Fundamentals':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
                    <p>This course project focuses on mastering fundamental Photoshop techniques essential for digital painting and image editing.</p>
                    
                    <h3>Learning Objectives</h3>
                    <p>The main goal was to develop proficiency in Photoshop's core tools and workflows, including layer management, masking, adjustment layers, and digital painting techniques. These skills form the foundation for more advanced digital art creation.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>The project involved practical exercises in color correction, compositing, and digital painting techniques. Special attention was given to understanding non-destructive workflows and efficient file organization methods that support professional-level digital art production.</p>
                `;

            case '猫咪日记':
            case 'Cat Diary':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
                    <p>This character design course project focuses on creating appealing animal characters with distinctive personalities and narrative potential.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>The "Cat Diary" project explores the charming and diverse personalities of cats through stylized character design. I aimed to create characters that balance anthropomorphic qualities with authentic feline characteristics, resulting in relatable yet distinctly cat-like personalities.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>I focused on expressive line work and simplified forms to convey personality through posture and facial expressions. The character designs incorporate principles of appeal and readability, ensuring each cat has a distinct silhouette and instantly recognizable traits. The simplified style allows for efficient animation potential while maintaining character depth.</p>
                `;

            default:
                return null;
        }
    }

    // 添加标题和描述翻译函数
    function translateTitleToEn(zhTitle) {
        // 标题翻译映射
        const titleMap = {
            '艺术家': 'Artist',
            '未知新球': 'Unknown Sphere',
            '樱花村': 'Sakura Village',
            '世界树': 'World Tree',
            '寺庙': 'Temple',
            '废弃小镇': 'Abandoned Town',
            '森林': 'Mysterious Forest',
            '视觉开发全集': 'Visual Development Collection',
            '创意透视流程': 'Creative Perspective Process',
            '角色素描': 'Character Sketches',
            'Photoshop基础': 'Photoshop Fundamentals',
            '猫咪日记': 'Cat Diary',
            '速写视频': 'Sketching Process 1',
            '速写视频2': 'Sketching Process 2'
        };
        
        return titleMap[zhTitle] || zhTitle;
    }

    function translateDescToEn(zhDesc) {
        // 描述翻译映射
        const descMap = {
            '原创角色设计': 'Original Character Design',
            '未来概念场景': 'Futuristic Concept Scene',
            '环境概念设计': 'Environmental Concept Design',
            '概念设计': 'Concept Design',
            '建筑概念设计': 'Architectural Concept Design',
            '个人概念设计': 'Personal Concept Design',
            '个人环境设计': 'Personal Environment Design',
            '神秘森林概念设计': 'Mysterious Forest Concept Design',
            '角色、道具与环境': 'Characters, Props & Environments',
            '从草图到成品': 'From Sketch to Final Work',
            '设计与表情研究': 'Design & Expression Studies',
            'ArtCenter课程作业': 'ArtCenter Course Assignment',
            '环境设计课程': 'Environment Design Course',
            '3D建模课程项目': '3D Modeling Course Project',
            '视觉开发课程': 'Visual Development Course',
            '角色设计课程': 'Character Design Course',
            '数字绘画课程': 'Digital Painting Course',
            '创作过程记录': 'Creation Process Recording'
        };
        
        return descMap[zhDesc] || zhDesc;
    }

    // 添加中文内容获取函数（在添加了getEnContent函数的同位置添加）
    function getZhContent(key) {
        // 根据key返回对应的中文内容HTML
        switch(key) {
            case '艺术家':
            case 'Artist':
                return `
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                    <p>这是一个原创角色设计项目，探索了独特的艺术风格和角色表现。</p>
                    
                    <h3>设计理念</h3>
                    <p>这个角色体现了我的艺术风格，融合了优雅与表现力。我旨在创造一个具有鲜明个性和视觉冲击力的角色，同时保持一定的神秘感和深度。</p>
                    
                    <h3>技术实现</h3>
                    <p>我运用了高级数字绘画技术，注重色彩和谐、光影处理和细节刻画。角色设计过程包括大量研究和多次迭代，以达到美学与角色叙事的完美平衡。</p>
                `;

            case '未知新球':
            case 'Unknown Sphere':
                return `
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                    <p>这是一个未来概念场景设计，探索了科技与自然环境的交互。</p>
                    
                    <h3>设计理念</h3>
                    <p>"未知新球"概念探索了先进技术在自然环境中的神秘感。设计旨在通过有机森林环境与几何、技术感球体的对比，创造一种奇妙感和科学好奇心。</p>
                    
                    <h3>技术实现</h3>
                    <p>我专注于创造一个真实的光照场景，配合戏剧性的雾气效果来增强神秘氛围。技术挑战在于平衡有机的森林元素与硬表面的球体设计，同时通过色彩和谐与大气透视保持视觉连贯性。</p>
                `;

            case '樱花村':
            case 'Sakura Village':
                return `
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                    <p>这个环境概念设计描绘了樱花季节的传统日本村庄。</p>
                    
                    <h3>设计理念</h3>
                    <p>"樱花村"概念探索了传统日本建筑与自然环境和谐融合的美感。我想捕捉樱花季节村庄的宁静与诗意氛围，强调这种季节性时刻的文化意义和美学价值。</p>
                    
                    <h3>技术实现</h3>
                    <p>我按照传统日本设计原则精心构建了建筑元素，同时特别关注光照和大气效果。樱花的粉色调与建筑的土色调形成平衡，创造出和谐的色彩搭配，增强了场景的情感冲击力。</p>
                `;

            case '世界树':
            case 'World Tree':
                return `
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                    <p>这个概念设计探索了神话中的世界树，融合了魔法元素与奇幻美学。</p>
                    
                    <h3>设计理念</h3>
                    <p>"世界树"概念受到各种神话的启发，其中宇宙树连接不同的存在领域。我旨在创造一个既古老又充满魔力的设计，通过其发光特性和宏伟规模强调树木作为世界桥梁的角色。</p>
                    
                    <h3>技术实现</h3>
                    <p>我使用了高级光照技术来创造树木散发的空灵光芒。构图经过精心规划，以强调树木的巨大规模，同时添加了精细的细节来表现其有机和魔法特性。色彩的选择旨在增强场景的神秘氛围。</p>
                `;

            case '寺庙':
            case 'Temple':
                return `
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
                    <p>这个建筑概念设计探索了当代诠释的传统东方寺庙建筑。</p>
                    
                    <h3>设计理念</h3>
                    <p>寺庙设计受到传统东方神圣建筑的启发，特别借鉴了中国和日本的美学原则。我想创造一个传达精神宁静的空间，同时融入尊重传统形式的微妙现代设计元素。</p>
                    
                    <h3>技术实现</h3>
                    <p>设计过程涉及广泛研究寺庙建筑中典型的比例和装饰元素。特别关注光照设计，使用自然光源提升空间品质和寺庙的精神氛围。色彩搭配刻意克制，以唤起宁静和沉思。</p>
                `;

            case '废弃小镇':
            case 'Abandoned Town':
                return `
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
                    <p>这是我的个人环境概念设计项目，探索被遗弃的城镇空间所蕴含的故事与情感。</p>
                    
                    <h3>设计理念</h3>
                    <p>通过这个作品，我想表达时间流逝和人类活动痕迹的美学。废弃的建筑与逐渐侵蚀的自然元素形成了一种独特的视觉张力，引发观者对过去与未来的思考。</p>
                    
                    <h3>技术实现</h3>
                    <p>在创作过程中，我特别注重光影的处理和氛围的营造，通过精细的细节和纹理表现，赋予这个废弃空间以生命力和故事感。色调的选择也经过精心考量，以增强场景的情感表达。</p>
                `;

            case '森林':
            case 'Mysterious Forest':
                return `
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2025年</span></h3>
                    <p>这是我的个人环境概念设计项目，探索神秘森林的视觉表现与氛围营造。</p>
                    
                    <h3>设计理念</h3>
                    <p>通过这个作品，我想表达自然的神秘与生命力。茂密的植被、独特的光线和雾气的处理，共同创造出一个既梦幻又真实的森林世界，引导观者进入一个充满想象的空间。</p>
                    
                    <h3>技术实现</h3>
                    <p>在创作过程中，我特别关注光线穿透树叶的效果和空间层次感的表现。通过精细的笔触和色彩渐变，营造出深邃而又充满活力的森林氛围，让观者能够感受到自然的神秘与宁静。</p>
                `;

            case '视觉开发全集':
            case 'Visual Development Collection':
                return `
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                    <p>这个项目涉及选择一部电影并设计一系列道具，同时面临保持所有设计统一风格的挑战。</p>
                    
                    <h3>设计理念</h3>
                    <p>这个项目的关键挑战是确保所有道具的风格统一。每件物品都需要看起来像是属于同一个世界观，并与所选电影的整体美学保持一致，同时仍然保持其独特的特点和用途。</p>
                    
                    <h3>工作流程</h3>
                    <p>该过程包括分析所选电影的视觉风格，创建概念草图，并确保每个道具既独特又与整体设计协调一致。这个项目展示了在服务于更大世界观搭建背景的叙事需求时，能够在多个项目中保持一致的设计语言。</p>
                `;

            case '创意透视流程':
            case 'Creative Perspective Process':
                return `
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                    <p>这个项目要求使用五点透视法创建一个赛博朋克世界场景，其中有两个角色在火车上。</p>
                    
                    <h3>设计选择</h3>
                    <p>我选择创建角色在赛博朋克城市中未来主义火车上的动态场景，利用五点透视增强戏剧性视觉冲击力。这个作业挑战我应用复杂的透视技术创建身临其境且视觉引人入胜的环境。</p>
                    
                    <h3>技术要点</h3>
                    <p>该项目展示了五点曲线透视的应用，这对创建戏剧性广角视图特别有效。透视技术有助于创造沉浸感和深度感，而角色在火车上的放置增加了叙事兴趣和场景的比例参考。从初始草图到最终渲染的过程展示了我对复杂插图挑战的方法论。</p>
                `;

            case '角色素描':
            case 'Character Sketches':
                return `
                    <h3>角色素描研究 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024年</span></h3>
                    <p>这个项目展示了角色设计和动作表情研究的素描过程。通过素描深入研究角色的外观特征以及动态姿态，为后续的角色创作奠定基础。</p>
                    
                    <h3>设计要点</h3>
                    <p>项目包含两个主要部分：角色整体设计和动作表情细节研究。通过对角色比例、服装和特征的精确素描，以及对各种表情和动作姿态的探索，全面展示了角色设计的基础工作。</p>
                `;

            case 'Photoshop基础':
            case 'Photoshop Fundamentals':
                return `
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
                    <p>这个课程项目专注于掌握数字绘画和图像编辑必备的基础Photoshop技术。</p>
                    
                    <h3>学习目标</h3>
                    <p>主要目标是熟练掌握Photoshop的核心工具和工作流程，包括图层管理、蒙版、调整图层和数字绘画技术。这些技能为更高级的数字艺术创作奠定了基础。</p>
                    
                    <h3>技术实现</h3>
                    <p>项目包括色彩校正、合成和数字绘画技术的实践练习。特别注重理解非破坏性工作流程和支持专业级数字艺术制作的高效文件组织方法。</p>
                `;

            case '猫咪日记':
            case 'Cat Diary':
                return `
                    <h3>项目背景 <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023年</span></h3>
                    <p>这个角色设计课程项目专注于创造具有鲜明个性和叙事潜力的动物角色。</p>
                    
                    <h3>设计理念</h3>
                    <p>"猫咪日记"项目通过风格化的角色设计探索猫咪的迷人和多样性格。我旨在创造平衡拟人化特质与真实猫科特征的角色，从而形成既亲切又独特猫咪性格。</p>
                    
                    <h3>技术实现</h3>
                    <p>我专注于富有表现力的线条和简化形式，通过姿势和面部表情传达性格。角色设计融合了吸引力和可读性原则，确保每只猫都有独特的轮廓和容易识别的特征。简化的风格允许高效的动画潜力，同时保持角色深度。</p>
                `;

            default:
                return null;
        }
    }

    // 添加调试函数，便于测试
    window.debugModalInfo = function() {
        console.log("当前模态框信息:", window.currentModalInfo);
        const lang = localStorage.getItem('preferredLanguage') || 'zh';
        console.log("当前语言:", lang);
        return {
            modalInfo: window.currentModalInfo,
            language: lang
        };
    };
    
    // 当页面加载完成时，检查语言设置并应用
    document.addEventListener('DOMContentLoaded', function() {
        console.log("页面加载完成，初始化翻译");
        
        // 初始化翻译
        initTranslation();
        
        // 注册作品项目点击事件
        registerProjectEvents();
        
        // 当模态框显示时，确保内容匹配当前语言
        const projectModal = document.getElementById('projectModal');
        if (projectModal) {
            projectModal.addEventListener('show', function() {
                const lang = localStorage.getItem('preferredLanguage') || 'zh';
                console.log("模态框显示，当前语言:", lang);
                
                // 如果有当前项目信息，更新模态框内容
                if (window.currentModalInfo) {
                    updateModalContentWithLanguage(lang);
                }
            });
        }
    });
    
    // 添加全局翻译更新钩子
    const originalUpdateAllTranslations = updateAllTranslations;
    updateAllTranslations = function() {
        // 调用原始翻译函数
        originalUpdateAllTranslations();
        
        // 如果模态框正在显示，更新其内容
        const projectModal = document.getElementById('projectModal');
        if (projectModal && projectModal.style.display === 'flex' && window.currentModalInfo) {
            const lang = localStorage.getItem('preferredLanguage') || 'zh';
            console.log("全局翻译更新，更新模态框内容，语言:", lang);
            updateModalContentWithLanguage(lang);
        }
    };

    // 添加一个全局测试函数，方便在控制台中调试内容获取和显示
    window.testContent = function(key, lang) {
        console.log(`测试内容: key=${key}, language=${lang}`);
        
        // 根据语言获取内容
        let content = null;
        if (lang === 'zh' || lang === 'cn') {
            content = getZhContent(key);
            console.log('中文内容:', !!content);
        } else {
            content = getEnContent(key);
            if (!content) {
                // 尝试翻译后查找
                const enKey = translateTitleToEn(key);
                content = getEnContent(enKey);
                console.log('尝试翻译键名:', key, '->', enKey, '结果:', !!content);
            }
            console.log('英文内容:', !!content);
        }
        
        // 显示内容
        if (content) {
            console.log('内容预览:', content.substring(0, 100) + '...');
            return {
                success: true,
                content: content,
                preview: content.substring(0, 100) + '...'
            };
        } else {
            console.log('未找到内容');
            return {
                success: false,
                message: '未找到内容'
            };
        }
    };
});

