/*
 * é¡¹ç›®è¯¦æƒ…è¯­è¨€åˆ‡æ¢åŠŸèƒ½
 * 
 * è¿™ä¸ªæ–‡ä»¶åŒ…å«äº†ä¸€ä¸ªæ–°çš„é¡¹ç›®è¯¦æƒ…æ¨¡æ€æ¡†çš„å®žçŽ°ï¼Œç¡®ä¿ä¸­è‹±æ–‡å†…å®¹èƒ½å¤Ÿæ­£ç¡®æ˜¾ç¤ºã€‚
 * ä¸»è¦æ”¹è¿›:
 * 1. ä½¿ç”¨contentDataå¯¹è±¡å­˜å‚¨æ‰€æœ‰é¡¹ç›®çš„ä¸­è‹±æ–‡å†…å®¹
 * 2. ç›´æŽ¥ä»ŽcontentDataèŽ·å–å†…å®¹ï¼Œè€Œä¸æ˜¯é€šè¿‡å‡½æ•°åŠ¨æ€ç”Ÿæˆ
 * 3. è¯­è¨€åˆ‡æ¢æŒ‰é’®å…è®¸åœ¨ä¸æ”¹å˜å…¨å±€è¯­è¨€è®¾ç½®çš„æƒ…å†µä¸‹æŸ¥çœ‹å…¶ä»–è¯­è¨€çš„å†…å®¹
 * 
 * æ³¨æ„: ç¡®ä¿HTMLæ–‡ä»¶ä¸­æœ‰è¯­è¨€åˆ‡æ¢æŒ‰é’®ï¼Œå¹¶ä¸”æœ‰data-langå±žæ€§
 * <button class="language-btn" data-lang="zh">ä¸­æ–‡</button>
 * <button class="language-btn" data-lang="en">EN</button>
 */

// æ»šåŠ¨åŠ¨ç”»
document.addEventListener('DOMContentLoaded', () => {
    // åˆ›å»ºå‘å…‰å…ƒç´ 
    const cursor = document.createElement('div');
    cursor.className = 'cursor-glow';
    document.body.appendChild(cursor);

    // è·Ÿè¸ªé¼ æ ‡ç§»åŠ¨
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // é¼ æ ‡è¿›å…¥å¯ç‚¹å‡»å…ƒç´ æ—¶çš„æ•ˆæžœ
    document.querySelectorAll('a, button, .portfolio-item').forEach(elem => {
        elem.addEventListener('mouseenter', () => {
            cursor.classList.add('active');
        });
        elem.addEventListener('mouseleave', () => {
            cursor.classList.remove('active');
        });
    });

    // å¤„ç†è§†é¢‘ç‚¹å‡»æ’­æ”¾/æš‚åœåŠŸèƒ½
    const videoContainers = document.querySelectorAll('.video-container');
    
    videoContainers.forEach(container => {
        const video = container.querySelector('video');
        const playIcon = container.querySelector('.play-icon');
        
        container.addEventListener('click', (e) => {
            e.stopPropagation(); // é˜»æ­¢å†’æ³¡ï¼Œé˜²æ­¢è§¦å‘ä½œå“é¡¹ç›®çš„ç‚¹å‡»äº‹ä»¶
            
            if (video.paused) {
                // å¦‚æžœè§†é¢‘æ˜¯æš‚åœçŠ¶æ€ï¼Œæ’­æ”¾è§†é¢‘å¹¶éšè—æ’­æ”¾å›¾æ ‡
                video.play();
                video.setAttribute('loop', 'true');
                playIcon.style.opacity = '0';
            } else {
                // å¦‚æžœè§†é¢‘æ­£åœ¨æ’­æ”¾ï¼Œæš‚åœè§†é¢‘å¹¶æ˜¾ç¤ºæ’­æ”¾å›¾æ ‡
                video.pause();
                playIcon.style.opacity = '0.8';
            }
        });
        
        // è§†é¢‘æ’­æ”¾ç»“æŸåŽæ˜¾ç¤ºæ’­æ”¾å›¾æ ‡
        video.addEventListener('ended', () => {
            playIcon.style.opacity = '0.8';
        });
    });

    // å¤„ç†å¼€åœºåŠ¨ç”»
    // æ£€æŸ¥æ˜¯å¦å·²ç»æ˜¾ç¤ºè¿‡å¼€åœºåŠ¨ç”»
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    const introAnimation = document.querySelector('.intro-animation');
    
    // å¦‚æžœé¡µé¢ä¸Šæœ‰å¼€åœºåŠ¨ç”»å…ƒç´ 
    if (introAnimation) {
        // å¦‚æžœå·²ç»æ˜¾ç¤ºè¿‡å¼€åœºåŠ¨ç”»ï¼Œåˆ™ç›´æŽ¥éšè—
        if (hasSeenIntro) {
            introAnimation.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // ç¡®ä¿å†…å®¹å¯è§
            const contentWrapper = document.querySelector('.content-wrapper');
            if (contentWrapper) {
                contentWrapper.style.opacity = '1';
                contentWrapper.style.visibility = 'visible';
            }
            
            // å¦‚æžœæ˜¯é¦–é¡µï¼Œæ˜¾ç¤ºæ¨±èŠ±
            if (isHomePage()) {
                showCherryBlossoms();
            }
        } else {
            // å¦åˆ™æ˜¾ç¤ºå¼€åœºåŠ¨ç”»å¹¶è®°å½•çŠ¶æ€
            sessionStorage.setItem('hasSeenIntro', 'true');
            
            // ç¡®ä¿å†…å®¹åˆå§‹éšè—
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
                        
                        // æ˜¾ç¤ºå†…å®¹
                        if (contentWrapper) {
                            contentWrapper.style.opacity = '1';
                            contentWrapper.style.visibility = 'visible';
                        }
                        
                        // æ·»åŠ æ¨±èŠ±åŠ¨ç”»
                        showCherryBlossoms();
                    }, 1000);
                });
            }
        }
    } else {
        // å¦‚æžœæ²¡æœ‰å¼€åœºåŠ¨ç”»å…ƒç´ ï¼Œç¡®ä¿å†…å®¹å¯è§
        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
            contentWrapper.style.opacity = '1';
            contentWrapper.style.visibility = 'visible';
        }
        
        // å¦‚æžœæ˜¯é¦–é¡µï¼Œæ˜¾ç¤ºæ¨±èŠ±
        if (isHomePage()) {
            showCherryBlossoms();
        }
    }

    // æ·»åŠ æ»šåŠ¨ç›‘å¬å‡½æ•°
    addScrollListeners();

    // æ·»åŠ æ»šåŠ¨ç›‘å¬å‡½æ•°
    function addScrollListeners() {
        const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
        
        // åˆå§‹æ£€æŸ¥
        checkElements(animatedElements);
        
        // æ»šåŠ¨æ—¶æ£€æŸ¥
        window.addEventListener('scroll', () => {
            checkElements(animatedElements);
        });
    }

    // æ£€æŸ¥å…ƒç´ æ˜¯å¦åœ¨è§†å£ä¸­
    function checkElements(elements) {
        const triggerBottom = window.innerHeight * 0.8;
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < triggerBottom) {
                element.classList.add('visible');
            }
        });
    }

    // æ·»åŠ è§†å·®æ•ˆæžœ
    window.addEventListener('scroll', () => {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(window.scrollY * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });

    // ä½œå“åˆ†ç±»åŠŸèƒ½
    const portfolioTabs = document.querySelectorAll('.portfolio-tab');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    // ç¡®ä¿åˆå§‹çŠ¶æ€ä¸‹æ‰€æœ‰é¡¹ç›®éƒ½å¯è§ï¼Œå¹¶å°†é€Ÿå†™é¡¹ç›®ç§»åˆ°æœ€åŽ
    const portfolioContainer = portfolioItems[0]?.parentNode;
    if (portfolioContainer) {
        const sketchItems = Array.from(portfolioItems).filter(item => 
            item.dataset.category.includes('sketch')
        );
        
        // å°†é€Ÿå†™é¡¹ç›®ç§»åˆ°æœ€åŽï¼Œå¹¶å°†å®ƒä»¬æ·»åŠ åˆ°ä¸ªäººä½œå“ç±»åˆ«ä¸­
        sketchItems.forEach(item => {
            // å°†é€Ÿå†™é¡¹ç›®æ·»åŠ åˆ°ä¸ªäººä½œå“ç±»åˆ«
            if (!item.dataset.category.includes('personal')) {
                item.dataset.category = item.dataset.category + ' personal';
            }
            
            // å°†é€Ÿå†™é¡¹ç›®ç§»åˆ°æœ€åŽ
            portfolioContainer.appendChild(item);
        });
        
        // è®¾ç½®æ‰€æœ‰é¡¹ç›®ä¸ºå¯è§
        portfolioItems.forEach(item => {
            item.style.display = 'block';
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
        });
    }
    
    portfolioTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // ç§»é™¤æ‰€æœ‰æ ‡ç­¾çš„activeç±»
            portfolioTabs.forEach(t => t.classList.remove('active'));
            // ç»™å½“å‰ç‚¹å‡»çš„æ ‡ç­¾æ·»åŠ activeç±»
            tab.classList.add('active');
            
            const category = tab.dataset.category;
            
            // å¤„ç†æ‰€æœ‰ç±»åˆ«ï¼ŒåŒ…æ‹¬é€Ÿå†™ç±»åˆ«
            portfolioItems.forEach(item => {
                if (category === 'all' || item.dataset.category.includes(category)) {
                    // æ˜¾ç¤ºåŒ¹é…çš„é¡¹ç›®
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    // éšè—ä¸åŒ¹é…çš„é¡¹ç›®
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 500);
                }
            });
            
            // æ›´æ–°ä½œå“ç¼–å·
            updatePortfolioNumbers();
        });
    });

    // èŽ·å–æ¨¡æ€æ¡†å…ƒç´ 
    const modal = document.getElementById('projectModal');
    const closeModal = document.querySelector('.close-modal');
    const modalTitle = document.querySelector('.modal-title');
    const modalGallery = document.querySelector('.modal-gallery');
    const modalDescription = document.querySelector('.modal-description');
    
    // å…³é—­æ¨¡æ€æ¡†
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // æ¢å¤æ»šåŠ¨
        });
    }
    
    // ç‚¹å‡»æ¨¡æ€æ¡†å¤–éƒ¨å…³é—­
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // ä¸ºæ‰€æœ‰ä½œå“é¡¹ç›®æ·»åŠ ç‚¹å‡»äº‹ä»¶
    portfolioItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // å¦‚æžœç‚¹å‡»çš„æ˜¯è§†é¢‘å®¹å™¨ï¼Œä¸æ‰“å¼€æ¨¡æ€æ¡†
            if (e.target.closest('.video-container')) {
                return;
            }
            
            e.preventDefault();
            
            // èŽ·å–é¡¹ç›®æ ‡é¢˜å’Œç±»åˆ«
            const imgElement = item.querySelector('img, video');
            if (!imgElement) return;
            
            const altText = imgElement.getAttribute('alt');
            const overlayTitle = item.querySelector('.portfolio-overlay h3')?.textContent || altText;
            const overlayCategory = item.querySelector('.portfolio-overlay p')?.textContent || '';
            const isVideo = imgElement.tagName.toLowerCase() === 'video';
            
            // è¾“å‡ºè°ƒè¯•ä¿¡æ¯
            console.log('ç‚¹å‡»çš„ä½œå“:', overlayTitle);
            console.log('altæ–‡æœ¬:', altText);
            console.log('å›¾ç‰‡è·¯å¾„:', imgElement.getAttribute('src'));
            
            // è®¾ç½®æ¨¡æ€æ¡†æ ‡é¢˜
            modalTitle.textContent = `${overlayTitle} - é¡¹ç›®è¯¦æƒ…`;
            
            // ç‰¹åˆ«å¤„ç†ç¬¬13ä¸ªä½œå“ï¼ˆMaya 3Då»ºæ¨¡ï¼‰
            if (overlayTitle === 'Maya 3Då»ºæ¨¡') {
                modalGallery.innerHTML = `
                    <div class="modal-image-container">
                        <img src="image/school/maya.png" alt="Maya 3Då»ºæ¨¡" class="full-width-image">
                        <h3>Maya 3Dç™½æ¨¡å±•ç¤º</h3>
                    </div>
                    <div class="modal-video-container">
                        <video src="image/sketch/WeChat_20250303101335.mp4" controls poster="image/sketch/WeChat_20250303101335.mp4#t=99999">
                            <source src="image/sketch/WeChat_20250303101335.mp4" type="video/mp4">
                        </video>
                        <h3>Maya 3Då»ºæ¨¡æ¼”ç¤º</h3>
                        <div class="dream-story">
                            <p>è¿™æ˜¯ä¸€ä¸ªå…³äºŽå­¦ç”Ÿçš„æ¢¦å¢ƒã€‚åœ¨æ¢¦ä¸­ï¼Œä»–æ‰“å¼€ç”µè„‘ï¼Œå±å¹•ä¸Šå…¨æ˜¯ä¸­å›½è¿‡å¹´çš„æ¬¢ä¹ç”»é¢ã€‚æ¸©æš–çš„çº¢è‰²ã€å–œåº†çš„ç¯ç¬¼ã€çƒ­é—¹çš„éž­ç‚®å£°ï¼Œä¸€åˆ‡éƒ½é‚£ä¹ˆçœŸå®žã€‚ä½†å°±åœ¨è¿™æ—¶ï¼Œé—¹é’Ÿçªç„¶å“èµ·ï¼Œä»–æ‰å‘çŽ°ä¹‹å‰çš„ä¸€åˆ‡éƒ½æ˜¯æ¢¦å¢ƒï¼ŒçŽ°åœ¨è¦èµ·åºŠåŽ»ä¸Šå­¦äº†ã€‚</p>
                        </div>
                    </div>
                `;
                
                modalDescription.innerHTML = `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                    <p>è¿™æ˜¯3Då»ºæ¨¡è¯¾ç¨‹çš„ä½œä¸šï¼Œä½¿ç”¨Mayaè½¯ä»¶åˆ›å»ºå’Œæ¸²æŸ“3Dæ¨¡åž‹ã€‚åŒæ—¶å±•ç¤ºäº†ç›¸å…³çš„å»ºæ¨¡è¿‡ç¨‹ã€‚</p>
                    
                    <h3>æŠ€æœ¯è¦ç‚¹</h3>
                    <p>åœ¨è¿™ä¸ªé¡¹ç›®ä¸­ï¼Œæˆ‘å­¦ä¹ äº†å¤šè¾¹å½¢å»ºæ¨¡ã€UVè´´å›¾ã€æè´¨è®¾ç½®å’Œç¯å…‰æ¸²æŸ“ç­‰Mayaæ ¸å¿ƒåŠŸèƒ½ï¼Œåˆ›å»ºäº†è¿™ä¸ª3Dåœºæ™¯ã€‚</p>
                    
                    <h3>åˆ›ä½œè¿‡ç¨‹</h3>
                    <p>ä»ŽåŸºç¡€å‡ ä½•ä½“å¼€å§‹ï¼Œé€šè¿‡ç»†åŒ–ã€é›•åˆ»å’Œçº¹ç†ç»˜åˆ¶ï¼Œé€æ­¥å®Œå–„æ¨¡åž‹ç»†èŠ‚ã€‚æœ€åŽé€šè¿‡ç²¾å¿ƒè®¾ç½®çš„ç¯å…‰å’Œæ¸²æŸ“å‚æ•°ï¼Œå‘ˆçŽ°å‡ºæœ€ç»ˆæ•ˆæžœã€‚é¡¹ç›®ä¸­è¿˜åŒ…å«äº†å®Œæ•´çš„å»ºæ¨¡è¿‡ç¨‹æ¼”ç¤ºã€‚</p>
                `;
            } else {
                // å…¶ä»–ä½œå“çš„å¤„ç†ä¿æŒä¸å˜
                switch (altText) {
                    case 'èƒŒæ™¯ç»˜ç”»':
                        // ä½¿ç”¨å·²æœ‰çš„èƒŒæ™¯ç»˜ç”»æ¨¡æ€æ¡†å†…å®¹
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/24FA_MonBGptg_Wk12_v02_Jay.png" alt="èƒŒæ™¯ç»˜ç”»" class="full-width-image">
                                <div class="image-caption">ç™½å¤©åœºæ™¯</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/24FA_MonBGptg_Wk12_v02_Jay_JB-copy-(1).png" alt="èƒŒæ™¯ç»˜ç”»å¤œæ™š" class="full-width-image">
                                <div class="image-caption">å¤œæ™šåœºæ™¯</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024å¹´</span></h3>
                            <p>è¯¥é¡¹ç›®çš„è¦æ±‚æ˜¯åœ¨åŒä¸€ä¸ªåœºæ™¯ä¸­åˆ›ä½œç™½å¤©å’Œå¤œæ™šä¸¤ä¸ªç‰ˆæœ¬ï¼Œå±•ç¤ºä¸åŒå…‰ç…§æ¡ä»¶ä¸‹çš„çŽ¯å¢ƒæ°›å›´å˜åŒ–ã€‚</p>
                            
                            <h3>è®¾è®¡ç†å¿µ</h3>
                            <p>è¿™ä¸ªåœºæ™¯æç»˜äº†ä¸€ä½é­”æ³•å¸ˆæ¥åˆ°å®é™çš„é›ªæ‘ã€‚ç™½å¤©ç‰ˆæœ¬å±•çŽ°äº†æ˜Žäº®ã€æ¸…æ–°çš„æ°›å›´ï¼Œè€Œå¤œæ™šç‰ˆæœ¬åˆ™é€šè¿‡æœˆå…‰å’Œé­”æ³•å…ƒç´ çš„å…‰èŠ’åˆ›é€ å‡ºç¥žç§˜è€Œæ¢¦å¹»çš„æ„Ÿè§‰ã€‚</p>
                            
                            <h3>æŠ€æœ¯å®žçŽ°</h3>
                            <p>é€šè¿‡ç²¾å¿ƒè®¾è®¡çš„å…‰å½±å¤„ç†å’Œè‰²å½©é€‰æ‹©ï¼Œæˆ‘æˆåŠŸåœ°åœ¨ä¿æŒåœºæ™¯ä¸€è‡´æ€§çš„åŒæ—¶ï¼Œå±•çŽ°äº†ç™½å¤©ä¸Žå¤œæ™šæˆªç„¶ä¸åŒçš„è§†è§‰æ•ˆæžœå’Œæƒ…æ„Ÿæ°›å›´ã€‚</p>
                        `;
                        break;
                        
                    case 'çŒ«å’ªæ—¥è®°':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/cat diary (1).png" alt="çŒ«å’ªæ—¥è®°" class="full-width-image">
                                <div class="image-caption">çŒ«å’ªæ—¥è®°é¡¹ç›®</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                            <p>è¿™æ˜¯ä¸€ä¸ªjournalismè¯¾ç¨‹ä½œä¸šï¼Œè¦æ±‚æˆ‘ä»¬ç”¨èº«è¾¹æ—¥å¸¸ç”Ÿæ´»ä¸­çš„äº‹ç‰©åˆ›ä½œä¸€ä¸ªjournalismé¡¹ç›®ã€‚</p>
                            
                            <h3>åˆ›ä½œç†å¿µ</h3>
                            <p>æˆ‘é€‰æ‹©äº†è®°å½•æˆ‘å®¶çŒ«å’ªçš„æ—¥å¸¸ç”Ÿæ´»ä½œä¸ºä¸»é¢˜ï¼Œé€šè¿‡è§‚å¯Ÿå’Œè®°å½•å®ƒçš„è¡Œä¸ºã€ä¹ æƒ¯å’Œæœ‰è¶£çž¬é—´ï¼Œåˆ›ä½œäº†è¿™æœ¬çŒ«å’ªæ—¥è®°ã€‚</p>
                            
                            <h3>è¡¨çŽ°æ‰‹æ³•</h3>
                            <p>æˆ‘ä½¿ç”¨äº†æ¸©æš–çš„è‰²è°ƒå’Œç”ŸåŠ¨çš„æç»˜æ–¹å¼ï¼ŒçœŸå®žè®°å½•çŒ«å’ªçš„æ—¥å¸¸ï¼Œå±•çŽ°å® ç‰©ä¸Žä¸»äººä¹‹é—´çš„æƒ…æ„Ÿè”ç³»ï¼Œä»¥åŠçŒ«å’ªç‹¬ç‰¹çš„ä¸ªæ€§å’Œé­…åŠ›ã€‚</p>
                        `;
                        break;
                        
                    case 'PhotoshopåŸºç¡€':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/class_work photoshop fundomental.png" alt="PhotoshopåŸºç¡€" class="full-width-image">
                                <div class="image-caption">æ•°å­—ç»˜ç”»ä½œå“</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                            <p>è¿™æ˜¯Photoshopæ•°å­—ç»˜ç”»åŸºç¡€è¯¾ç¨‹çš„ä½œä¸šï¼Œæ—¨åœ¨æŽŒæ¡è½¯ä»¶çš„æ ¸å¿ƒåŠŸèƒ½å’Œæ•°å­—ç»˜ç”»çš„åŸºæœ¬æŠ€å·§ã€‚</p>
                            
                            <h3>æŠ€æœ¯è¦ç‚¹</h3>
                            <p>åœ¨è¿™ä¸ªé¡¹ç›®ä¸­ï¼Œæˆ‘è¿ç”¨äº†å›¾å±‚ç®¡ç†ã€æ··åˆæ¨¡å¼ã€ç”»ç¬”æŠ€å·§å’Œè‰²å½©è°ƒæ•´ç­‰Photoshopæ ¸å¿ƒåŠŸèƒ½ï¼Œåˆ›ä½œäº†è¿™å¹…æ•°å­—æ’ç”»ã€‚</p>
                            
                            <h3>å­¦ä¹ æ”¶èŽ·</h3>
                            <p>é€šè¿‡è¿™ä¸ªé¡¹ç›®ï¼Œæˆ‘ä¸»è¦æƒ³è¦ç»ƒä¹ å¦‚ä½•ä½¿ç”¨Photoshopçš„å„ç§å·¥å…·å’ŒæŠ€æœ¯æ¥åˆ›é€ æ›´å¥½çš„ç”»è´¨æ„Ÿã€‚ç‰¹åˆ«æ˜¯åœ¨å…‰å½±å¤„ç†ã€çº¹ç†è¡¨çŽ°å’Œè‰²å½©è¿‡æ¸¡æ–¹é¢ï¼Œæˆ‘å°è¯•äº†å¤šç§æ–¹æ³•æ¥æå‡ä½œå“çš„è§†è§‰è´¨é‡å’ŒçœŸå®žæ„Ÿã€‚</p>
                        `;
                        break;
                        
                    case 'åˆ›æ„é€è§†':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/Screenshot 2025-03-01 212506.png" alt="åˆ›æ„é€è§†" class="full-width-image">
                                <div class="image-caption">æˆå“</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/creative prespetive.jpg" alt="åˆ›æ„é€è§†è¿‡ç¨‹" class="full-width-image">
                                <div class="image-caption">è¿‡ç¨‹</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                            <p>è¿™æ˜¯çŽ¯å¢ƒè®¾è®¡è¯¾ç¨‹çš„ä½œä¸šï¼Œè¦æ±‚è¿ç”¨é€è§†åŽŸç†åˆ›å»ºå…·æœ‰ç©ºé—´æ„Ÿå’Œæ·±åº¦çš„åœºæ™¯ã€‚é€šè¿‡è¿™ä¸ªé¡¹ç›®ï¼Œæˆ‘å­¦ä¹ äº†è§£äººç‰©å’Œåœºæ™¯å¤§å°å…³ç³»ï¼Œå¹¶åˆ©ç”¨SketchUpè¿™ä¸ª3Dè½¯ä»¶æ¥ç¡®è®¤èˆ¹çš„é€è§†ã€‚åœ¨èŽ·å–3Dèˆ¹æ¨¡åž‹çš„åŸºç¡€ä¸Šï¼Œæˆ‘è®¾è®¡äº†è‡ªå·±çš„æ¦‚å¿µï¼Œæœ€ç»ˆå®Œæˆäº†è¿™å¹…ä½œå“ã€‚</p>
                            
                            <h3>è®¾è®¡ç†å¿µ</h3>
                            <p>æˆ‘åˆ›ä½œäº†è¿™ä¸ªæœªæ¥åŸŽå¸‚åœºæ™¯ï¼Œè¡¨çŽ°äº†ä¸€ä¸ªç»å¤§éƒ¨åˆ†äººä»¬éƒ½è¢«ç»Ÿæ²»çš„ä¸–ç•Œã€‚é€šè¿‡ç²¾ç¡®çš„é€è§†å…³ç³»å’Œå…‰å½±å¤„ç†ï¼Œè¥é€ å‡ºæ—¢å®å¤§åˆåŽ‹æŠ‘çš„è§†è§‰ä½“éªŒã€‚</p>
                            
                            <h3>æŠ€æœ¯æŒ‘æˆ˜</h3>
                            <p>é¡¹ç›®ä¸­æœ€å¤§çš„æŒ‘æˆ˜æ˜¯å¤„ç†å¤æ‚çš„é€è§†å…³ç³»å’Œå¤šç‚¹å…‰æºã€‚é€šè¿‡åå¤ç ”ç©¶å’Œå®žè·µï¼Œç»“åˆSketchUpè½¯ä»¶çš„è¾…åŠ©ï¼Œæˆ‘æˆåŠŸåœ°è§£å†³äº†è¿™äº›é—®é¢˜ï¼Œä½¿ç”»é¢æ—¢ç¬¦åˆé€è§†è§„å¾‹åˆå…·æœ‰è‰ºæœ¯è¡¨çŽ°åŠ›ã€‚</p>
                        `;
                        break;
                    
                    case 'åˆ›æ„é€è§†æµç¨‹':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/creative prespetive (3).png" alt="åˆ›æ„é€è§†è‰å›¾é˜¶æ®µ" class="full-width-image">
                                <div class="image-caption">è¿‡ç¨‹ - åˆæœŸè‰å›¾</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/creative prespetvie (2).png" alt="åˆ›æ„é€è§†ä¸­æœŸé˜¶æ®µ" class="full-width-image">
                                <div class="image-caption">è¿‡ç¨‹ - çº¿ç¨¿å®Œå–„</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/creative prespetvie.png" alt="åˆ›æ„é€è§†æœ€ç»ˆä½œå“" class="full-width-image">
                                <div class="image-caption">æœ€ç»ˆæ¸²æŸ“</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024å¹´</span></h3>
                            <p>è¿™ä¸ªé¡¹ç›®çš„è¦æ±‚æ˜¯ä½¿ç”¨5ç‚¹é€è§†æŠ€æœ¯åˆ›ä½œä¸€ä¸ªåœºæ™¯ã€‚æˆ‘é€‰æ‹©äº†è®¾è®¡ä¸€ä¸ªèµ›åšæœ‹å…‹é£Žæ ¼çš„æœªæ¥ä¸–ç•Œï¼Œé€šè¿‡ç²¾ç¡®çš„é€è§†å…³ç³»å±•çŽ°å‡ºå®å¤§çš„åŸŽå¸‚æ™¯è§‚ã€‚</p>
                            
                            <h3>åˆ›æ„é€è§†æµç¨‹å±•ç¤º</h3>
                            <p>è¿™ä¸ªé¡¹ç›®å±•ç¤ºäº†åˆ›æ„é€è§†ä½œå“ä»ŽåˆæœŸè‰å›¾åˆ°æœ€ç»ˆæ¸²æŸ“çš„å®Œæ•´æµç¨‹ã€‚é€šè¿‡ä¸‰ä¸ªå…³é”®é˜¶æ®µçš„å±•ç¤ºï¼Œå¯ä»¥æ¸…æ™°åœ°çœ‹åˆ°ä½œå“çš„æ¼”å˜è¿‡ç¨‹ã€‚</p>
                            
                            <h3>æŠ€æœ¯è¦ç‚¹</h3>
                            <p>æˆ‘è¿ç”¨äº†5ç‚¹é€è§†æŠ€æœ¯ï¼Œå°†å»ºç­‘å…ƒç´ é€šè¿‡ç²¾ç¡®çš„æ‰­æ›²å’Œå˜å½¢åˆ›é€ å‡ºè§†è§‰å†²å‡»åŠ›ã€‚ä¸ºäº†è¡¨çŽ°äººç‰©åœ¨è¿™ä¸ªå®å¤§åœºæ™¯ä¸­çš„æ¯”ä¾‹ï¼Œæˆ‘ç‰¹æ„è®¾è®¡äº†ç«è½¦ä¸Šçš„ä¸¤ä¸ªè§’è‰²ï¼Œè®©è§‚ä¼—èƒ½å¤Ÿç›´è§‚åœ°æ„Ÿå—åˆ°çŽ¯å¢ƒçš„åºžå¤§è§„æ¨¡ã€‚ä»ŽåˆæœŸè‰å›¾çš„æž„æ€ï¼Œåˆ°çº¿ç¨¿çš„ç²¾ç¡®å¤„ç†ï¼Œå†åˆ°æœ€ç»ˆçš„ç»†èŠ‚æ¸²æŸ“ï¼Œæ¯ä¸€æ­¥éƒ½å±•ç¤ºäº†ä¸åŒçš„æŠ€æœ¯è¿ç”¨ã€‚</p>
                        `;
                        break;
                        
                    case 'è§†è§‰å¼€å‘å…¨é›†':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/vis_dev_character.png" alt="è§’è‰²è®¾è®¡" class="full-width-image">
                                <div class="image-caption">è§’è‰²è®¾è®¡</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/vis_dev_prop.png" alt="é“å…·è®¾è®¡" class="full-width-image">
                                <div class="image-caption">é“å…·è®¾è®¡</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/vis_dev_vehicle.png" alt="è½½å…·è®¾è®¡" class="full-width-image">
                                <div class="image-caption">è½½å…·è®¾è®¡</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/enviroment 1.png" alt="çŽ¯å¢ƒè®¾è®¡ 1" class="full-width-image">
                                <div class="image-caption">çŽ¯å¢ƒè®¾è®¡ 1</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/enviroment 2.png" alt="çŽ¯å¢ƒè®¾è®¡ 2" class="full-width-image">
                                <div class="image-caption">çŽ¯å¢ƒè®¾è®¡ 2</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/enviroment 3.png" alt="çŽ¯å¢ƒè®¾è®¡ 3" class="full-width-image">
                                <div class="image-caption">çŽ¯å¢ƒè®¾è®¡ 3</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/enviroment 4.png" alt="çŽ¯å¢ƒè®¾è®¡ 4" class="full-width-image">
                                <div class="image-caption">çŽ¯å¢ƒè®¾è®¡ 4</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>è§†è§‰å¼€å‘å…¨é›† <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2025å¹´</span></h3>
                            <p>è¿™æ˜¯æˆ‘åœ¨è§†è§‰å¼€å‘è¯¾ç¨‹ä¸­å®Œæˆçš„ä¸€ç³»åˆ—ä½œå“ï¼ŒåŒ…æ‹¬è§’è‰²è®¾è®¡ã€é“å…·è®¾è®¡ã€è½½å…·è®¾è®¡å’Œå¤šä¸ªçŽ¯å¢ƒè®¾è®¡ä½œä¸šã€‚</p>
                            
                            <h3>è®¾è®¡ç†å¿µ</h3>
                            <p>åœ¨è¿™ä¸ªç³»åˆ—ä¸­ï¼Œæˆ‘å°è¯•åˆ›å»ºä¸€ä¸ªè¿žè´¯çš„è§†è§‰é£Žæ ¼ï¼Œæ¯ä¸ªè®¾è®¡å…ƒç´ éƒ½æ”¯æŒæ•´ä½“ä¸–ç•Œè§‚çš„æž„å»ºã€‚ä»Žè§’è‰²ã€é“å…·åˆ°çŽ¯å¢ƒï¼Œæˆ‘æ³¨é‡ç»†èŠ‚ã€åŠŸèƒ½æ€§å’Œç¾Žå­¦çš„ç»Ÿä¸€ã€‚</p>
                            
                            <h3>æŠ€æœ¯å®žçŽ°</h3>
                            <p>ä½œå“é‡‡ç”¨äº†å¤šç§æŠ€æ³•å’Œå·¥å…·ï¼ŒåŒ…æ‹¬æ•°å­—ç»˜ç”»ã€3Dè¾…åŠ©å’Œæ¦‚å¿µè®¾è®¡æ–¹æ³•ã€‚æˆ‘ç‰¹åˆ«å…³æ³¨å…‰å½±å¤„ç†ã€æè´¨è¡¨çŽ°å’Œç©ºé—´æž„æˆï¼Œç¡®ä¿è®¾è®¡æ—¢å…·æœ‰è§†è§‰å¸å¼•åŠ›åˆç¬¦åˆå®žé™…åŠŸèƒ½éœ€æ±‚ã€‚</p>
                        `;
                        break;
                        
                    case 'è§†è§‰å¼€å‘':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/vis dev.jpg" alt="è§†è§‰å¼€å‘" class="full-width-image">
                                <div class="image-caption">è§†è§‰å¼€å‘ä½œå“ 1</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/vis dev 3.jpg" alt="è§†è§‰å¼€å‘ 3" class="full-width-image">
                                <div class="image-caption">è§†è§‰å¼€å‘ä½œå“ 2</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/vis dev 4.jpg" alt="è§†è§‰å¼€å‘ 4" class="full-width-image">
                                <div class="image-caption">è§†è§‰å¼€å‘ä½œå“ 3</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/vis dev 5.jpg" alt="è§†è§‰å¼€å‘ 5" class="full-width-image">
                                <div class="image-caption">è§†è§‰å¼€å‘ä½œå“ 4</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                            <p>è¿™æ˜¯è§†è§‰å¼€å‘è¯¾ç¨‹çš„ä½œä¸šï¼Œè¦æ±‚é€‰æ‹©ä¸€éƒ¨ç”µå½±ï¼Œå¹¶ä¸ºå…¶è®¾è®¡ä¸€ç³»åˆ—é“å…·ã€‚</p>
                            
                            <h3>è®¾è®¡ç†å¿µ</h3>
                            <p>åœ¨è¿™ä¸ªé¡¹ç›®ä¸­ï¼Œæˆ‘ä¸ºé€‰å®šçš„ç”µå½±è®¾è®¡äº†å¤šç§ä¸åŒçš„é“å…·ã€‚æœ€å¤§çš„æŒ‘æˆ˜æ˜¯ç¡®ä¿æ‰€æœ‰é“å…·åœ¨é£Žæ ¼ä¸Šä¿æŒç»Ÿä¸€æ€§ï¼Œä½¿å®ƒä»¬çœ‹èµ·æ¥åƒæ˜¯æ¥è‡ªåŒä¸€ä¸ªä¸–ç•Œè§‚ï¼Œç¬¦åˆç”µå½±çš„æ•´ä½“ç¾Žå­¦å’Œæ°›å›´ã€‚</p>
                            
                            <h3>å·¥ä½œæµç¨‹</h3>
                            <p>æˆ‘é¦–å…ˆåˆ†æžäº†ç”µå½±çš„è§†è§‰é£Žæ ¼å’Œè‰²å½©æ–¹æ¡ˆï¼Œç„¶åŽè®¾è®¡äº†å¤šä¸ªæ¦‚å¿µè‰å›¾ã€‚é€šè¿‡åå¤ä¿®æ”¹å’Œè°ƒæ•´ï¼Œç¡®ä¿æ¯ä¸ªé“å…·æ—¢æœ‰ç‹¬ç‰¹æ€§åˆä¸Žæ•´ä½“é£Žæ ¼åè°ƒä¸€è‡´ï¼Œæœ€ç»ˆå‘ˆçŽ°å‡ºä¸€å¥—é£Žæ ¼ç»Ÿä¸€çš„é“å…·è®¾è®¡ã€‚</p>
                        `;
                        break;
                        
                    case 'è‰ºæœ¯å®¶':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/personal/artist (1).png" alt="è‰ºæœ¯å®¶" class="full-width-image">
                                <div class="image-caption">è§’è‰²è®¾è®¡</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>è®¾è®¡ç†å¿µ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024å¹´</span></h3>
                            <p>è¿™æ˜¯ä¸€ä¸ª3Då’Œäººç‰©ç»ƒä¹ é¡¹ç›®ï¼Œé€šè¿‡ç»“åˆ3Då»ºæ¨¡å’Œæ•°å­—ç»˜ç”»æ¥åˆ›ä½œä¸€ä¸ªå®Œæ•´çš„åœºæ™¯ã€‚</p>
                            
                            <h3>æŠ€æœ¯å®žçŽ°</h3>
                            <p>æˆ‘é¦–å…ˆä½¿ç”¨3Dè½¯ä»¶å»ºæ¨¡åˆ¶ä½œäº†ä¸€ä¸ªé’¢ç´æ¨¡åž‹ï¼Œç„¶åŽå°†å…¶å¯¼å…¥åˆ°Photoshopä¸­ã€‚åœ¨PSä¸­è¿›è¡Œäº†åœºæ™¯çš„ç»†åŒ–å¤„ç†ï¼Œæ·»åŠ äº†äººç‰©å½¢è±¡ï¼Œå¹¶é€šè¿‡å…‰å½±å’Œè‰²å½©çš„è°ƒæ•´ï¼Œè¥é€ å‡ºæ¸©æš–è€Œå¯Œæœ‰è‰ºæœ¯æ„Ÿçš„æ°›å›´ã€‚</p>
                        `;
                        break;
                        
                    case 'æœªçŸ¥æ–°çƒ':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/personal/personal project.jpg" alt="æœªçŸ¥æ–°çƒ" class="full-width-image">
                                <div class="image-caption">æœªæ¥ç§‘æŠ€æ¦‚å¿µåœºæ™¯</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024å¹´</span></h3>
                            <p>è¿™æ˜¯ä¸€ä¸ªæœªæ¥ç§‘æŠ€æ¦‚å¿µåœºæ™¯è®¾è®¡é¡¹ç›®ï¼ŒæŽ¢ç´¢äº†ä¸€ä¸ªç¥žç§˜çš„æœªçŸ¥æ˜Ÿçƒã€‚</p>
                        `;
                        break;
                        
                    case 'æ¨±èŠ±æ‘':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/personal/sakura-villege.png" alt="æ¨±èŠ±æ‘" class="full-width-image">
                                <div class="image-caption">çŽ¯å¢ƒæ¦‚å¿µè®¾è®¡</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024å¹´</span></h3>
                            <p>è¿™æ˜¯æˆ‘çš„ä¸ªäººçŽ¯å¢ƒæ¦‚å¿µè®¾è®¡é¡¹ç›®ï¼Œçµæ„Ÿæ¥æºäºŽæ—¥æœ¬ä¼ ç»Ÿæ‘è½å’Œæ¨±èŠ±å­£èŠ‚çš„ç¾Žä¸½æ™¯è‰²ã€‚</p>
                            
                            <h3>è®¾è®¡ç†å¿µ</h3>
                            <p>æˆ‘æƒ³é€šè¿‡è¿™ä¸ªä½œå“æ•æ‰æ¨±èŠ±ç››å¼€æ—¶çš„å®é™ä¸Žæ¢¦å¹»ï¼ŒåŒæ—¶å±•çŽ°ä¼ ç»Ÿå»ºç­‘ä¸Žè‡ªç„¶æ™¯è§‚çš„å’Œè°å…±å­˜ã€‚æŸ”å’Œçš„è‰²è°ƒå’Œé£˜è½çš„èŠ±ç“£åˆ›é€ å‡ºä¸€ç§è¶…è„±çŽ°å®žçš„æ°›å›´ã€‚</p>
                            
                            <h3>æŠ€æœ¯å®žçŽ°</h3>
                            <p>è¿™å¹…ä½œå“é‡‡ç”¨äº†æ•°å­—ç»˜ç”»æŠ€æœ¯ï¼Œç‰¹åˆ«æ³¨é‡å…‰å½±æ•ˆæžœå’Œæ°›å›´è¥é€ ã€‚é€šè¿‡ç²¾ç»†çš„ç¬”è§¦å’Œå±‚æ¬¡æ„Ÿçš„å¤„ç†ï¼Œå‘ˆçŽ°å‡ºæ¨±èŠ±é£˜è½çš„åŠ¨æ€ç¾Žæ„Ÿå’Œç©ºé—´çš„æ·±åº¦ã€‚</p>
                        `;
                        break;
                        
                    case 'ä¸–ç•Œæ ‘':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/personal/world tree.png" alt="ä¸–ç•Œæ ‘" class="full-width-image">
                                <div class="image-caption">æ¦‚å¿µè®¾è®¡</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024å¹´</span></h3>
                            <p>è¿™æ˜¯æˆ‘çš„ä¸ªäººæ¦‚å¿µè®¾è®¡é¡¹ç›®ï¼ŒæŽ¢ç´¢ä¸–ç•Œæ ‘è¿™ä¸€ç¥žè¯å…ƒç´ åœ¨çŽ°ä»£è§†è§‰è¯­è¨€ä¸­çš„è¡¨è¾¾ã€‚</p>
                            
                            <h3>è®¾è®¡ç†å¿µ</h3>
                            <p>ä¸–ç•Œæ ‘åœ¨è®¸å¤šæ–‡åŒ–ä¸­éƒ½æ˜¯è¿žæŽ¥å¤©åœ°çš„è±¡å¾ã€‚åœ¨è¿™ä¸ªä½œå“ä¸­ï¼Œæˆ‘å°è¯•å°†è¿™ä¸€å¤è€æ¦‚å¿µä¸Žé­”æ³•å…ƒç´ ç»“åˆï¼Œåˆ›é€ å‡ºä¸€ä¸ªæ—¢ç¥žç§˜åˆå®å¤§çš„è§†è§‰å½¢è±¡ã€‚</p>
                            
                            <h3>åˆ›ä½œè¿‡ç¨‹</h3>
                            <p>ä»ŽåˆæœŸæž„æ€åˆ°æœ€ç»ˆå‘ˆçŽ°ï¼Œæˆ‘æ³¨é‡æ ‘æœ¨çš„ç”Ÿå‘½åŠ›å’Œç¥žç§˜æ„Ÿçš„è¡¨è¾¾ã€‚é€šè¿‡ç‰¹æ®Šçš„å…‰æ•ˆå’Œæž„å›¾ï¼Œå¼ºè°ƒäº†ä¸–ç•Œæ ‘çš„å®ä¼Ÿä¸Žè¶…å‡¡ï¼ŒåŒæ—¶ä¿ç•™äº†è‡ªç„¶ç”Ÿé•¿çš„æœ‰æœºæ„Ÿã€‚</p>
                        `;
                        break;
                        
                    case 'å¯ºåº™':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/personal/å¯ºåº™è‰ç¨¿.jpg" alt="å¯ºåº™" class="full-width-image">
                                <div class="image-caption">å®Œæˆå“</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/personal/na_shi-.jpg" alt="é‚£æ—¶" class="full-width-image">
                                <div class="image-caption">è¿‡ç¨‹</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                            <p>è¿™æ˜¯ä¸€ä¸ªèžåˆä¸œæ–¹ä¼ ç»Ÿç¾Žå­¦ä¸ŽçŽ°ä»£æ•°å­—æŠ€æœ¯çš„æ¦‚å¿µè®¾è®¡é¡¹ç›®ã€‚çµæ„Ÿæ¥æºäºŽä¸­å›½å¤ä»£å¯ºåº™å»ºç­‘ä¸Žè‡ªç„¶æ™¯è§‚çš„å’Œè°ç»Ÿä¸€ã€‚</p>
                            
                            <h3>åˆ›ä½œè¿‡ç¨‹</h3>
                            <p>ä»ŽåˆæœŸè‰å›¾åˆ°æœ€ç»ˆæ¸²æŸ“ï¼Œæ•´ä¸ªè¿‡ç¨‹æ³¨é‡ç»†èŠ‚ä¸Žæ°›å›´çš„è¥é€ ã€‚é€šè¿‡å¤šå±‚æ¬¡çš„å…‰å½±å¤„ç†ï¼Œå±•çŽ°å‡ºç©ºé—´çš„æ·±åº¦ä¸Žç¥žç§˜æ„Ÿã€‚</p>
                            
                            <h3>è®¾è®¡ç†å¿µ</h3>
                            <p>æƒ³è®¾è®¡ä¸€ä¸ªä½Žè§’åº¦è§†è§’(Low Angle Shot)æ¥å‘ˆçŽ°è¿™åº§è’åºŸçš„å¯ºåº™ï¼Œé€šè¿‡è¿™ç§è§†è§’å¢žå¼ºå»ºç­‘çš„å®ä¼Ÿæ„Ÿå’Œç¥žç§˜æ°›å›´ï¼ŒåŒæ—¶å±•çŽ°å²æœˆæµé€çš„ç—•è¿¹ä¸Žè‡ªç„¶ä¾µèš€çš„ç¾Žæ„Ÿã€‚</p>
                        `;
                        break;
                        
                    case 'åºŸå¼ƒå°é•‡':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/personal/åºŸå¼ƒå°é•‡.png" alt="åºŸå¼ƒå°é•‡" class="full-width-image">
                                <div class="image-caption">åºŸå¼ƒå°é•‡æ¦‚å¿µè®¾è®¡</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                            <p>è¿™æ˜¯æˆ‘çš„ä¸ªäººçŽ¯å¢ƒæ¦‚å¿µè®¾è®¡é¡¹ç›®ï¼ŒæŽ¢ç´¢è¢«é—å¼ƒçš„åŸŽé•‡ç©ºé—´æ‰€è•´å«çš„æ•…äº‹ä¸Žæƒ…æ„Ÿã€‚</p>
                            
                            <h3>è®¾è®¡ç†å¿µ</h3>
                            <p>é€šè¿‡è¿™ä¸ªä½œå“ï¼Œæˆ‘æƒ³è¡¨è¾¾æ—¶é—´æµé€å’Œäººç±»æ´»åŠ¨ç—•è¿¹çš„ç¾Žå­¦ã€‚åºŸå¼ƒçš„å»ºç­‘ä¸Žé€æ¸ä¾µèš€çš„è‡ªç„¶å…ƒç´ å½¢æˆäº†ä¸€ç§ç‹¬ç‰¹çš„è§†è§‰å¼ åŠ›ï¼Œå¼•å‘è§‚è€…å¯¹è¿‡åŽ»ä¸Žæœªæ¥çš„æ€è€ƒã€‚</p>
                            
                            <h3>æŠ€æœ¯å®žçŽ°</h3>
                            <p>åœ¨åˆ›ä½œè¿‡ç¨‹ä¸­ï¼Œæˆ‘ç‰¹åˆ«æ³¨é‡å…‰å½±çš„å¤„ç†å’Œæ°›å›´çš„è¥é€ ï¼Œé€šè¿‡ç²¾ç»†çš„ç»†èŠ‚å’Œçº¹ç†è¡¨çŽ°ï¼Œèµ‹äºˆè¿™ä¸ªåºŸå¼ƒç©ºé—´ä»¥ç”Ÿå‘½åŠ›å’Œæ•…äº‹æ„Ÿã€‚è‰²è°ƒçš„é€‰æ‹©ä¹Ÿç»è¿‡ç²¾å¿ƒè€ƒé‡ï¼Œä»¥å¢žå¼ºåœºæ™¯çš„æƒ…æ„Ÿè¡¨è¾¾ã€‚</p>
                        `;
                        break;
                        
                    case 'æ£®æž—':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/personal/æ£®æž—.png" alt="æ£®æž—" class="full-width-image">
                                <div class="image-caption">ç¥žç§˜æ£®æž—æ¦‚å¿µè®¾è®¡</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                            <p>è¿™æ˜¯æˆ‘çš„ä¸ªäººçŽ¯å¢ƒæ¦‚å¿µè®¾è®¡é¡¹ç›®ï¼ŒæŽ¢ç´¢ç¥žç§˜æ£®æž—çš„è§†è§‰è¡¨çŽ°ä¸Žæ°›å›´è¥é€ ã€‚</p>
                            
                            <h3>è®¾è®¡ç†å¿µ</h3>
                            <p>é€šè¿‡è¿™ä¸ªä½œå“ï¼Œæˆ‘æƒ³è¡¨è¾¾è‡ªç„¶çš„ç¥žç§˜ä¸Žç”Ÿå‘½åŠ›ã€‚èŒ‚å¯†çš„æ¤è¢«ã€ç‹¬ç‰¹çš„å…‰çº¿å’Œé›¾æ°”çš„å¤„ç†ï¼Œå…±åŒåˆ›é€ å‡ºä¸€ä¸ªæ—¢æ¢¦å¹»åˆçœŸå®žçš„æ£®æž—ä¸–ç•Œï¼Œå¼•å¯¼è§‚è€…è¿›å…¥ä¸€ä¸ªå……æ»¡æƒ³è±¡çš„ç©ºé—´ã€‚</p>
                            
                            <h3>æŠ€æœ¯å®žçŽ°</h3>
                            <p>åœ¨åˆ›ä½œè¿‡ç¨‹ä¸­ï¼Œæˆ‘ç‰¹åˆ«å…³æ³¨å…‰çº¿ç©¿é€æ ‘å¶çš„æ•ˆæžœå’Œç©ºé—´å±‚æ¬¡æ„Ÿçš„è¡¨çŽ°ã€‚é€šè¿‡ç²¾ç»†çš„ç¬”è§¦å’Œè‰²å½©æ¸å˜ï¼Œè¥é€ å‡ºæ·±é‚ƒè€Œåˆå……æ»¡æ´»åŠ›çš„æ£®æž—æ°›å›´ï¼Œè®©è§‚è€…èƒ½å¤Ÿæ„Ÿå—åˆ°è‡ªç„¶çš„ç¥žç§˜ä¸Žå®é™ã€‚</p>
                        `;
                        break;
                        
                    case 'é€Ÿå†™è§†é¢‘':
                    case 'é€Ÿå†™è§†é¢‘2':
                        // è§†é¢‘é¡¹ç›®çš„å¤„ç†
                        const videoSrc = imgElement.getAttribute('src');
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <video src="${videoSrc}" controls autoplay muted class="full-width-image">
                                    æ‚¨çš„æµè§ˆå™¨ä¸æ”¯æŒè§†é¢‘æ ‡ç­¾ã€‚
                                </video>
                                <div class="image-caption">åˆ›ä½œè¿‡ç¨‹è§†é¢‘</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024å¹´</span></h3>
                            <p>è¿™æ˜¯æˆ‘çš„é€Ÿå†™åˆ›ä½œè¿‡ç¨‹è®°å½•ï¼Œå±•ç¤ºäº†ä»Žæž„æ€åˆ°å®Œæˆçš„æ•´ä¸ªç»˜ç”»æµç¨‹ã€‚</p>
                            
                            <h3>åˆ›ä½œæ–¹æ³•</h3>
                            <p>è§†é¢‘è®°å½•äº†æˆ‘çš„æ•°å­—ç»˜ç”»è¿‡ç¨‹ï¼ŒåŒ…æ‹¬çº¿ç¨¿ç»˜åˆ¶ã€åŸºç¡€ä¸Šè‰²ã€ç»†èŠ‚åˆ»ç”»å’Œæœ€ç»ˆæ•ˆæžœè°ƒæ•´ç­‰é˜¶æ®µã€‚</p>
                            
                            <h3>æŠ€æœ¯è¦ç‚¹</h3>
                            <p>åœ¨åˆ›ä½œè¿‡ç¨‹ä¸­ï¼Œæˆ‘è¿ç”¨äº†å¤šç§æ•°å­—ç»˜ç”»æŠ€å·§ï¼ŒåŒ…æ‹¬å›¾å±‚ç®¡ç†ã€ç”»ç¬”æŠ€æ³•å’Œè‰²å½©è°ƒæ•´ç­‰ï¼Œå±•ç¤ºäº†ä¸“ä¸šæ•°å­—è‰ºæœ¯å·¥ä½œæµç¨‹ã€‚</p>
                        `;
                        break;
                        
                    case 'è§’è‰²ç´ æ':
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                <img src="image/school/sketching for entd.png" alt="è§’è‰²è®¾è®¡ç´ æ" class="full-width-image">
                                <div class="image-caption">è§’è‰²è®¾è®¡</div>
                            </div>
                            <div class="modal-image-container">
                                <img src="image/school/sketching for entd (2).png" alt="åŠ¨ä½œå’Œè¡¨æƒ…ç´ æ" class="full-width-image">
                                <div class="image-caption">åŠ¨ä½œå’Œè¡¨æƒ…ç ”ç©¶</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>è§’è‰²ç´ æç ”ç©¶ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024å¹´</span></h3>
                            <p>è¿™ä¸ªé¡¹ç›®å±•ç¤ºäº†è§’è‰²è®¾è®¡å’ŒåŠ¨ä½œè¡¨æƒ…ç ”ç©¶çš„ç´ æè¿‡ç¨‹ã€‚é€šè¿‡ç´ ææ·±å…¥ç ”ç©¶è§’è‰²çš„å¤–è§‚ç‰¹å¾ä»¥åŠåŠ¨æ€å§¿æ€ï¼Œä¸ºåŽç»­çš„è§’è‰²åˆ›ä½œå¥ å®šåŸºç¡€ã€‚</p>
                            
                            <h3>è®¾è®¡è¦ç‚¹</h3>
                            <p>é¡¹ç›®åŒ…å«ä¸¤ä¸ªä¸»è¦éƒ¨åˆ†ï¼šè§’è‰²æ•´ä½“è®¾è®¡å’ŒåŠ¨ä½œè¡¨æƒ…ç»†èŠ‚ç ”ç©¶ã€‚é€šè¿‡å¯¹è§’è‰²æ¯”ä¾‹ã€æœè£…å’Œç‰¹å¾çš„ç²¾ç¡®ç´ æï¼Œä»¥åŠå¯¹å„ç§è¡¨æƒ…å’ŒåŠ¨ä½œå§¿æ€çš„æŽ¢ç´¢ï¼Œå…¨é¢å±•ç¤ºäº†è§’è‰²è®¾è®¡çš„åŸºç¡€å·¥ä½œã€‚</p>
                        `;
                        break;
                        
                    default:
                        // é»˜è®¤æƒ…å†µä¸‹æ˜¾ç¤ºåŸºæœ¬ä¿¡æ¯
                        const imgSrc = isVideo ? imgElement.getAttribute('src') : imgElement.getAttribute('src');
                        const mediaElement = isVideo ? 
                            `<video src="${imgSrc}" controls autoplay muted class="full-width-image">
                                æ‚¨çš„æµè§ˆå™¨ä¸æ”¯æŒè§†é¢‘æ ‡ç­¾ã€‚
                             </video>` : 
                            `<img src="${imgSrc}" alt="${altText}" class="full-width-image">`;
                        
                        modalGallery.innerHTML = `
                            <div class="modal-image-container">
                                ${mediaElement}
                                <div class="image-caption">${overlayTitle}</div>
                            </div>
                        `;
                        
                        modalDescription.innerHTML = `
                            <h3>é¡¹ç›®ä¿¡æ¯</h3>
                            <p>${overlayTitle} - ${overlayCategory}</p>
                            
                            <h3>è¯¦ç»†æè¿°</h3>
                            <p>è¿™æ˜¯æˆ‘çš„${overlayCategory}ä½œå“ï¼Œå±•ç¤ºäº†æˆ‘åœ¨${overlayTitle}æ–¹é¢çš„åˆ›ä½œèƒ½åŠ›å’ŒæŠ€æœ¯æ°´å¹³ã€‚</p>
                        `;
                        break;
                }
            }
            
            // æ˜¾ç¤ºæ¨¡æ€æ¡†
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // é˜²æ­¢èƒŒæ™¯æ»šåŠ¨
        });
    });

    // æ·»åŠ åŠ¨ç”»ç±»
    function addAnimationClasses() {
        // æ·»åŠ æ·¡å…¥åŠ¨ç”»
        document.querySelectorAll('.fade-in').forEach((element, index) => {
            element.style.animationDelay = `${index * 0.2}s`;
        });
        
        // æ·»åŠ å·¦ä¾§æ»‘å…¥åŠ¨ç”»
        document.querySelectorAll('.slide-in-left').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateX(-50px)';
            element.style.transition = 'all 0.8s ease';
        });
        
        // æ·»åŠ å³ä¾§æ»‘å…¥åŠ¨ç”»
        document.querySelectorAll('.slide-in-right').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateX(50px)';
            element.style.transition = 'all 0.8s ease';
        });
        
        // æ·»åŠ ç¼©æ”¾åŠ¨ç”»
        document.querySelectorAll('.scale-in').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'scale(0.9)';
            element.style.transition = 'all 0.8s ease';
        });
    }
    
    // åˆå§‹åŒ–åŠ¨ç”»ç±»
    addAnimationClasses();
    
    // æ·»åŠ å¯è§æ€§ç±»
    document.addEventListener('scroll', () => {
        document.querySelectorAll('.slide-in-left, .slide-in-right, .scale-in').forEach(element => {
            const position = element.getBoundingClientRect();
            
            // æ£€æŸ¥å…ƒç´ æ˜¯å¦åœ¨è§†å£ä¸­
            if (position.top < window.innerHeight * 0.8) {
                element.style.opacity = '1';
                element.style.transform = 'translateX(0) scale(1)';
            }
        });
    });
    
    // åˆå§‹æ£€æŸ¥å¯è§å…ƒç´ 
    setTimeout(() => {
        const event = new Event('scroll');
        document.dispatchEvent(event);
    }, 100);

    // æ·»åŠ å…¨å±€å˜é‡æ¥è·Ÿè¸ªæ¨±èŠ±çŠ¶æ€
    let sakuraVisible = true;

    // ä¿®æ”¹æ»šåŠ¨ç›‘å¬éƒ¨åˆ†ï¼Œç¡®ä¿åœ¨æ»šåŠ¨åˆ°ä½œå“é›†éƒ¨åˆ†æ—¶æ¨±èŠ±æ¶ˆå¤±
    window.addEventListener('scroll', () => {
        // èŽ·å–ä½œå“é›†éƒ¨åˆ†çš„ä½ç½®
        const portfolioSection = document.querySelector('#portfolio');
        if (portfolioSection) {
            const portfolioPosition = portfolioSection.getBoundingClientRect().top;
            const screenPosition = window.innerHeight * 0.7; // å½“ä½œå“é›†éƒ¨åˆ†è¿›å…¥è§†å£çš„70%ä½ç½®æ—¶
            
            // èŽ·å–æ¨±èŠ±å®¹å™¨
            const sakuraContainer = document.querySelector('.sakura-container');
            
            // å¦‚æžœæ»šåŠ¨åˆ°ä½œå“é›†éƒ¨åˆ†ï¼Œåˆ™æ·¡å‡ºå¹¶æœ€ç»ˆç§»é™¤æ¨±èŠ±æ•ˆæžœ
            if (portfolioPosition < screenPosition) {
                if (sakuraContainer && sakuraVisible) {
                    sakuraVisible = false;
                    sakuraContainer.style.opacity = '0';
                    
                    // å»¶è¿ŸåŽå®Œå…¨ç§»é™¤æ¨±èŠ±å®¹å™¨
                    setTimeout(() => {
                        // æ¸…é™¤å®šæ—¶å™¨
                        if (sakuraContainer && sakuraContainer.dataset.intervalId) {
                            clearInterval(parseInt(sakuraContainer.dataset.intervalId));
                        }
                        // ç§»é™¤å®¹å™¨
                        if (sakuraContainer && sakuraContainer.parentNode) {
                            sakuraContainer.remove();
                        }
                    }, 1000);
                }
            } else {
                // å¦‚æžœå‘ä¸Šæ»šåŠ¨ç¦»å¼€ä½œå“é›†éƒ¨åˆ†ï¼Œä¸”æ¨±èŠ±å®¹å™¨ä¸å­˜åœ¨ï¼Œåˆ™é‡æ–°åˆ›å»º
                if (!sakuraContainer && !sakuraVisible && isHomePage()) {
                    sakuraVisible = true;
                    // é‡æ–°åˆ›å»ºæ¨±èŠ±æ•ˆæžœ
                    showCherryBlossoms();
                }
            }
        }
        
        // ... existing scroll event code ...
    });

    // ä¿®æ”¹æŽ§åˆ¶ PORTFOLIO æ–‡å­—é€æ˜Žåº¦çš„ä»£ç 
    window.addEventListener('scroll', () => {
        const welcomeText = document.querySelector('.welcome-text');
        if (!welcomeText) return;
        
        // èŽ·å–æ»šåŠ¨è·ç¦»
        const scrollPosition = window.scrollY;
        
        // è®¾ç½®é€æ˜Žåº¦å˜åŒ–çš„é˜ˆå€¼ï¼ˆå¯ä»¥æ ¹æ®éœ€è¦è°ƒæ•´ï¼‰
        const fadeStart = 100; // å¼€å§‹æ·¡å‡ºçš„æ»šåŠ¨ä½ç½®
        const fadeEnd = 500;   // å®Œå…¨é€æ˜Žçš„æ»šåŠ¨ä½ç½®
        
        // è®¡ç®—é€æ˜Žåº¦
        let opacity = 1;
        
        if (scrollPosition > fadeStart) {
            opacity = 1 - (scrollPosition - fadeStart) / (fadeEnd - fadeStart);
            opacity = Math.max(0, opacity); // ç¡®ä¿é€æ˜Žåº¦ä¸å°äºŽ0
        }
        
        // åº”ç”¨é€æ˜Žåº¦
        welcomeText.style.opacity = opacity;
    });

    // æ·»åŠ å°è§’è‰²çš„çœ¼ç›è·Ÿéšé¼ æ ‡åŠŸèƒ½
    const character = document.querySelector('.little-character');
    const pupils = document.querySelectorAll('.pupil');
    
    if (character && pupils.length) {
        // çœ¼ç›è·Ÿéšé¼ æ ‡ç§»åŠ¨
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            pupils.forEach(pupil => {
                const eyeRect = pupil.parentElement.getBoundingClientRect();
                const eyeCenterX = eyeRect.left + eyeRect.width / 2;
                const eyeCenterY = eyeRect.top + eyeRect.height / 2;
                
                // è®¡ç®—çœ¼ç›å’Œé¼ æ ‡ä¹‹é—´çš„è§’åº¦
                const angle = Math.atan2(mouseY - eyeCenterY, mouseX - eyeCenterX);
                
                // é™åˆ¶çœ¼çƒç§»åŠ¨èŒƒå›´
                const distance = Math.min(3, Math.hypot(mouseX - eyeCenterX, mouseY - eyeCenterY) / 20);
                
                // ç§»åŠ¨çœ¼çƒ
                const pupilX = Math.cos(angle) * distance;
                const pupilY = Math.sin(angle) * distance;
                
                pupil.style.transform = `translate(calc(-50% + ${pupilX}px), calc(-50% + ${pupilY}px))`;
            });
        });
        
        // ç‚¹å‡»å°è§’è‰²æ—¶è®©å®ƒæ¶ˆå¤±
        character.addEventListener('click', () => {
            character.style.opacity = '0';
            character.style.transform = 'scale(0) rotate(360deg)';
            
            // åŠ¨ç”»ç»“æŸåŽç§»é™¤å…ƒç´ 
            setTimeout(() => {
                character.remove();
            }, 500);
        });
    }
    
    // å¤„ç†å¾®ä¿¡äºŒç»´ç å¼¹çª—
    const wechatLink = document.getElementById('wechat-link');
    const wechatModal = document.getElementById('wechat-modal');
    const closeWechat = document.querySelector('.close-wechat');
    
    if (wechatLink && wechatModal) {
        // ç‚¹å‡»å¾®ä¿¡å›¾æ ‡æ˜¾ç¤ºå¼¹çª—
        wechatLink.addEventListener('click', (e) => {
            e.preventDefault();
            wechatModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // é˜²æ­¢èƒŒæ™¯æ»šåŠ¨
        });
        
        // ç‚¹å‡»å…³é—­æŒ‰é’®éšè—å¼¹çª—
        if (closeWechat) {
            closeWechat.addEventListener('click', () => {
                wechatModal.style.display = 'none';
                document.body.style.overflow = 'auto'; // æ¢å¤æ»šåŠ¨
            });
        }
        
        // ç‚¹å‡»å¼¹çª—å¤–éƒ¨åŒºåŸŸå…³é—­å¼¹çª—
        window.addEventListener('click', (e) => {
            if (e.target === wechatModal) {
                wechatModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // æ·»åŠ åŠ¨æ€æ›´æ–°ä½œå“ç¼–å·çš„å‡½æ•°
    function updatePortfolioNumbers() {
        // èŽ·å–æ‰€æœ‰å½“å‰å¯è§çš„ä½œå“é¡¹ç›®
        const visibleItems = document.querySelectorAll('.portfolio-item:not([style*="display: none"])');
        
        // ä¸ºæ¯ä¸ªå¯è§é¡¹ç›®é‡æ–°åˆ†é…ç¼–å·
        visibleItems.forEach((item, index) => {
            const numberElement = item.querySelector('.portfolio-number');
            if (numberElement) {
                numberElement.textContent = index + 1;
            }
        });
    }

    // èŽ·å–ä½œå“é›†å®¹å™¨
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (portfolioGrid) {
        // é‡æ–°æŽ’åºä½œå“é¡¹ç›®ï¼Œç¡®ä¿å®ƒä»¬æŒ‰ç…§æˆ‘ä»¬æƒ³è¦çš„é¡ºåºæ˜¾ç¤º
        const portfolioItems = Array.from(portfolioGrid.querySelectorAll('.portfolio-item'));
        
        // æ¸…ç©ºå®¹å™¨
        portfolioGrid.innerHTML = '';
        
        // æŒ‰ç…§ç±»åˆ«é‡æ–°æ·»åŠ é¡¹ç›®
        // é¦–å…ˆæ·»åŠ ä¸ªäººä½œå“ï¼ˆä¸åŒ…æ‹¬é€Ÿå†™è§†é¢‘ï¼‰
        portfolioItems.filter(item => 
            item.getAttribute('data-category').includes('personal') && 
            !item.getAttribute('data-category').includes('sketch')
        ).forEach(item => portfolioGrid.appendChild(item));
        
        // ç„¶åŽæ·»åŠ å­¦æ ¡ä½œå“
        portfolioItems.filter(item => item.getAttribute('data-category').includes('school'))
            .forEach(item => portfolioGrid.appendChild(item));
        
        // æœ€åŽæ·»åŠ é€Ÿå†™è§†é¢‘
        portfolioItems.filter(item => item.getAttribute('data-category').includes('sketch'))
            .forEach(item => portfolioGrid.appendChild(item));
        
        // æ›´æ–°ç¼–å·
        updatePortfolioNumbers();
    }

    // åˆå§‹åŒ–é­”æ³•é˜µç²’å­
    if (document.querySelector('.intro-circle')) {
        createMagicParticles();
    }

    // é­”æ³•é˜µç²’å­æ•ˆæžœ
    function createMagicParticles() {
        const particles = document.createElement('div');
        particles.className = 'particles';
        document.querySelector('.intro-circle').appendChild(particles);
        
        // åˆ›å»º20ä¸ªç²’å­
        for (let i = 0; i < 20; i++) {
            createParticle(particles);
        }
    }

    function createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // éšæœºä½ç½®
        const angle = Math.random() * Math.PI * 2;
        const radius = 150 + Math.random() * 100; // åœ¨é­”æ³•é˜µå‘¨å›´
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // è®¾ç½®åˆå§‹ä½ç½®
        particle.style.left = `calc(50% + ${x}px)`;
        particle.style.top = `calc(50% + ${y}px)`;
        
        // éšæœºå¤§å°
        const size = 2 + Math.random() * 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // éšæœºé€æ˜Žåº¦
        particle.style.opacity = 0.3 + Math.random() * 0.7;
        
        // æ·»åŠ åˆ°å®¹å™¨
        container.appendChild(particle);
        
        // å¼€å§‹åŠ¨ç”»
        animateParticle(particle);
    }

    function animateParticle(particle) {
        // éšæœºç§»åŠ¨æ–¹å‘å’Œè·ç¦»
        const moveX = -50 + Math.random() * 100;
        const moveY = -50 + Math.random() * 100;
        
        // éšæœºåŠ¨ç”»æŒç»­æ—¶é—´
        const duration = 3 + Math.random() * 4;
        
        // è®¾ç½®CSSå˜é‡ç”¨äºŽåŠ¨ç”»
        particle.style.setProperty('--move-x', `${moveX}px`);
        particle.style.setProperty('--move-y', `${moveY}px`);
        
        // è®¾ç½®åŠ¨ç”»
        particle.style.animation = `floatParticle ${duration}s infinite alternate`;
        
        // éšæœºå»¶è¿Ÿ
        particle.style.animationDelay = `${Math.random() * 2}s`;
    }

    // æ£€æŸ¥æ˜¯å¦æ˜¯é¦–é¡µ
    function isHomePage() {
        return window.location.pathname === '/' || 
               window.location.pathname === '/index.html' || 
               window.location.href.endsWith('index.html') ||
               window.location.pathname.endsWith('/');
    }

    // æ¨±èŠ±åŠ¨ç”»å‡½æ•°
    function showCherryBlossoms() {
        // æ£€æŸ¥æ˜¯å¦æœ‰æ¨±èŠ±å®¹å™¨å…ƒç´ 
        let cherryContainer = document.querySelector('.sakura-container');
        
        // å¦‚æžœä¸å­˜åœ¨ï¼Œåˆ›å»ºä¸€ä¸ªæ–°çš„
        if (!cherryContainer) {
            cherryContainer = document.createElement('div');
            cherryContainer.className = 'sakura-container';
            document.body.appendChild(cherryContainer);
        } else {
            // å¦‚æžœå­˜åœ¨ï¼Œæ¸…é™¤çŽ°æœ‰æ¨±èŠ±
            cherryContainer.innerHTML = '';
            // æ¸…é™¤ä¹‹å‰çš„å®šæ—¶å™¨
            if (cherryContainer.dataset.intervalId) {
                clearInterval(parseInt(cherryContainer.dataset.intervalId));
            }
        }
        
        // ç¡®ä¿å®¹å™¨å¯è§
        cherryContainer.style.opacity = '1';
        cherryContainer.style.display = 'block';
        
        // åˆ›å»ºæ¨±èŠ±
        function createSakura() {
            const sakura = document.createElement('div');
            sakura.className = 'sakura';
            sakura.innerHTML = 'â€';
            sakura.style.left = Math.random() * 100 + 'vw';
            sakura.style.fontSize = Math.random() * 10 + 10 + 'px';
            sakura.style.animationDuration = Math.random() * 10 + 10 + 's';
            cherryContainer.appendChild(sakura);
            
            // åŠ¨ç”»ç»“æŸåŽç§»é™¤
            setTimeout(() => {
                if (sakura && sakura.parentNode) {
                    sakura.remove();
                }
            }, 20000);
        }
        
        // åˆå§‹åˆ›å»ºä¸€äº›æ¨±èŠ±
        for (let i = 0; i < 10; i++) {
            setTimeout(createSakura, 300 * i);
        }
        
        // æŒç»­åˆ›å»ºæ¨±èŠ±ï¼Œä½†é™åˆ¶æ•°é‡å’Œé¢‘çŽ‡
        const sakuraInterval = setInterval(() => {
            // å¦‚æžœæ¨±èŠ±æ•°é‡è¶…è¿‡30ä¸ªï¼Œåˆ™ä¸å†åˆ›å»º
            if (cherryContainer.children.length < 30) {
                createSakura();
            }
        }, 2000); // é™ä½Žåˆ›å»ºé¢‘çŽ‡
        
        // ä¿å­˜interval IDä»¥ä¾¿éœ€è¦æ—¶æ¸…é™¤
        cherryContainer.dataset.intervalId = sakuraInterval;
        
        return cherryContainer;
    }

    // é¡µé¢åŠ è½½æ—¶
    document.addEventListener('DOMContentLoaded', function() {
        // å¦‚æžœæ˜¯é¦–é¡µï¼Œé‡ç½®æ¨±èŠ±åŠ¨ç”»çŠ¶æ€å¹¶æ˜¾ç¤ºæ¨±èŠ±
        if (isHomePage()) {
            // é‡ç½®æ¨±èŠ±åŠ¨ç”»çŠ¶æ€
            sessionStorage.removeItem('hasSeenIntro');
            
            // æ˜¾ç¤ºæ¨±èŠ±åŠ¨ç”»
            showCherryBlossoms();
        }
        
        // æ±‰å ¡èœå•åŠŸèƒ½
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        const navLinks = document.querySelector('.nav-links');
        const menuOverlay = document.querySelector('.menu-overlay');
        
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', function() {
                // åˆ‡æ¢æ±‰å ¡èœå•æ¿€æ´»çŠ¶æ€
                this.classList.toggle('active');
                // åˆ‡æ¢å¯¼èˆªèœå•æ˜¾ç¤ºçŠ¶æ€
                navLinks.classList.toggle('active');
                // åˆ‡æ¢èƒŒæ™¯é®ç½©
                if (menuOverlay) {
                    menuOverlay.classList.toggle('active');
                }
                // é˜²æ­¢æ»šåŠ¨
                if (navLinks.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            });
        }
        
        // ç‚¹å‡»é®ç½©å…³é—­èœå•
        if (menuOverlay) {
            menuOverlay.addEventListener('click', function() {
                if (hamburgerMenu) hamburgerMenu.classList.remove('active');
                if (navLinks) navLinks.classList.remove('active');
                this.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // ç‚¹å‡»å¯¼èˆªé“¾æŽ¥å…³é—­èœå•
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

    // å…¨å±€é€šç”¨ç¿»è¯‘å¯¹è±¡
    const globalTranslations = {
        'zh': {
            'nav-home': 'é¦–é¡µ',
            'nav-about': 'å…³äºŽæˆ‘',
            'nav-portfolio': 'ä½œå“é›†',
            'nav-contact': 'è”ç³»æ–¹å¼',
            'resume-cn': 'ç®€åŽ†(ä¸­æ–‡)',
            'resume-en': 'Resume(EN)',
            'contact-title': 'CONTACT ME',
            'contact-content': 'è‹¥æ‚¨å¯¹æˆ‘çš„ä½œå“æ„Ÿå…´è¶£ï¼Œæˆ–æœ‰ä»»ä½•åˆä½œæœºä¼šï¼Œè¯·ç‚¹å‡»ä¸‹æ–¹æŒ‰é’®äº†è§£æ›´å¤šè”ç³»æ–¹å¼',
            'thanks-title': 'æ„Ÿè°¢',
            'thanks-content': 'æ„Ÿè°¢æ‚¨çš„ç•™è¨€ï¼Œæˆ‘ä¼šå°½å¿«å›žå¤ã€‚',
            'back-home': 'è¿”å›žé¦–é¡µ',
            'about-title': 'å…³äºŽæˆ‘',
            'about-content': 'æˆ‘æ˜¯ä¸€åå……æ»¡çƒ­æƒ…çš„æ•°å­—è‰ºæœ¯å®¶ï¼Œä¸“æ³¨äºŽæ¦‚å¿µè®¾è®¡å’Œæ’ç”»åˆ›ä½œã€‚æˆ‘çš„ä½œå“èžåˆäº†ä¼ ç»Ÿè‰ºæœ¯ä¸Žæ•°å­—æŠ€æœ¯ï¼Œè‡´åŠ›äºŽåˆ›é€ ç‹¬ç‰¹çš„è§†è§‰ä½“éªŒã€‚',
            'project-details': 'é¡¹ç›®è¯¦æƒ…',
            'portfolio-title': 'ä½œå“é›†',
            'tab-all': 'å…¨éƒ¨',
            'tab-personal': 'ä¸ªäººä½œå“',
            'tab-school': 'å­¦æ ¡ä½œå“',
            'tab-sketch': 'é€Ÿå†™',
            'hero-greeting': 'ä½ å¥½ï¼Œæˆ‘æ˜¯ <span class="highlight">Shijie Lin</span>',
            'hero-subtitle1': 'æ’ç”»å¸ˆ',
            'hero-subtitle2': 'è™šæ‹Ÿå¼€å‘',
            'hero-subtitle3': 'æ¦‚å¿µè®¾è®¡å¸ˆ',
            'hero-cta': 'æŸ¥çœ‹æˆ‘çš„ä½œå“',
            'intro-button': 'è¿›å…¥ä½œå“é›†',
            'view-portfolio': 'æŸ¥çœ‹æˆ‘çš„ä½œå“é›†',
            // æŠ€èƒ½å±•ç¤ºåŒºåŸŸç¿»è¯‘
            'skills-showcase-title': 'æˆ‘çš„ä¸“ä¸šé¢†åŸŸ',
            'design-process-title': 'è®¾è®¡æµç¨‹',
            'design-process-desc': 'ä»Žæ¦‚å¿µæž„æ€åˆ°æœ€ç»ˆä½œå“ï¼Œæˆ‘çš„è®¾è®¡æµç¨‹æ³¨é‡ç»†èŠ‚ä¸Žåˆ›æ–°ã€‚æ¯ä¸ªé¡¹ç›®éƒ½ç»è¿‡å……åˆ†ç ”ç©¶ã€è‰å›¾æŽ¢ç´¢ã€è¿­ä»£ä¼˜åŒ–å’Œç²¾ç»†æ‰§è¡Œï¼Œç¡®ä¿ä½œå“æ—¢æ»¡è¶³åŠŸèƒ½éœ€æ±‚åˆå…·å¤‡è‰ºæœ¯ä»·å€¼ã€‚',
            'technical-skills-title': 'ä¸“ä¸šæŠ€èƒ½',
            'technical-skills-desc': 'ç†Ÿç»ƒè¿ç”¨æ•°å­—ç»˜ç”»æŠ€æœ¯ä¸Ž3Då»ºæ¨¡å·¥å…·ï¼Œå°†åˆ›æ„è½¬åŒ–ä¸ºè§†è§‰ä½œå“ã€‚ç²¾é€šé€è§†ã€è‰²å½©ç†è®ºå’Œæž„å›¾åŽŸåˆ™ï¼Œèƒ½å¤Ÿåœ¨ä¸åŒè‰ºæœ¯é£Žæ ¼é—´è‡ªå¦‚è½¬æ¢ï¼Œä¸ºé¡¹ç›®å¸¦æ¥ç‹¬ç‰¹çš„è§†è§‰è¡¨è¾¾ã€‚',
            'creative-philosophy-title': 'åˆ›ä½œç†å¿µ',
            'creative-philosophy-desc': 'æˆ‘ç›¸ä¿¡è‰ºæœ¯æ˜¯è¿žæŽ¥æƒ…æ„Ÿä¸Žæƒ³è±¡çš„æ¡¥æ¢ã€‚æˆ‘çš„åˆ›ä½œèžåˆä¸œè¥¿æ–¹ç¾Žå­¦ï¼Œæ³¨é‡å™äº‹æ€§ä¸Žæ°›å›´è¥é€ ï¼Œé€šè¿‡ç»†èŠ‚ä¸Žè±¡å¾å…ƒç´ èµ‹äºˆä½œå“å±‚æ¬¡æ„Ÿå’Œå…±é¸£ï¼Œè®©è§‚è€…åœ¨è§†è§‰ä½“éªŒä¸­äº§ç”Ÿæƒ…æ„Ÿè¿žæŽ¥ã€‚',
            'years-experience': 'å¹´ä¸“ä¸šç»éªŒ',
            'completed-projects': 'å®Œæˆé¡¹ç›®',
            'client-satisfaction': 'å®¢æˆ·æ»¡æ„åº¦',
            // å…³äºŽé¡µé¢æ–°å¢žç¿»è¯‘
            'about-intro': 'æˆ‘æ˜¯æž—ä¸–æ°ï¼ŒArtCenter College of Design å¨±ä¹è®¾è®¡ä¸“ä¸šåœ¨è¯»ç”Ÿï¼Œä¸“æ³¨æ¸¸æˆä¸Žå½±è§†é¢†åŸŸçš„è§’è‰²/åœºæ™¯æ¦‚å¿µè®¾è®¡ï¼Œä¼šç”¨3Då»ºæ¨¡ï¼ˆBlender/Mayaï¼‰ä¸Žæ•°å­—ç»˜ç”»ï¼ˆPhotoshop/Procreateï¼‰èžåˆï¼Œæ›¾ä¸ºå•†ä¸šé¡¹ç›®æå‡è§†è§‰è¾¨è¯†åº¦å¹¶å®žçŽ°100%äº¤ä»˜æ»¡æ„åº¦ã€‚å¸Œæœ›ä½ ä¼šå–œæ¬¢æˆ‘çš„ä½œå“ã€‚',
            'about-title-role': 'æ¦‚å¿µè‰ºæœ¯å®¶ / è§†è§‰å™äº‹è®¾è®¡å¸ˆ',
            'about-location': 'ðŸ“ ä¸Šæµ· Â· Los Angeles | ðŸŽ“ ArtCenter College of Design åœ¨è¯»',
            'about-traits-title': 'ðŸŒŸ ä¸ªäººç‰¹è´¨',
            'trait-1': 'å¿«é€Ÿå­¦ä¹ è€…',
            'trait-2': 'çƒ­çˆ±æŽ¢ç´¢æ–°æŠ€æœ¯',
            'trait-3': 'åˆ›æ„æ€ç»´æ´»è·ƒ',
            'trait-4': 'æ¸¸æˆæ–‡åŒ–çˆ±å¥½è€…',
            'trait-5': 'å¨±ä¹äº§ä¸šç ”ç©¶è€…',
            'trait-6': 'è·¨åª’ä½“åˆ›ä½œè€…',
            'services-title': 'ðŸŽ¯ ä¸“ä¸šæœåŠ¡',
            'service-1-title': 'è§’è‰²/åœºæ™¯æ¦‚å¿µè®¾è®¡',
            'service-1-desc': 'ä¸“æ³¨äºŽåˆ›é€ ç‹¬ç‰¹è€Œå¯Œæœ‰ç”Ÿå‘½åŠ›çš„è§’è‰²ä¸Žåœºæ™¯è®¾è®¡',
            'service-2-title': 'ä¸–ç•Œè§‚è§†è§‰å¼€å‘',
            'service-2-desc': 'æ“…é•¿èžåˆä¸œæ–¹ä¼ ç»Ÿç¾Žå­¦ä¸ŽçŽ°ä»£æ•°å­—æŠ€æœ¯',
            'service-3-title': 'åˆ›æ„è®¾è®¡åä½œ',
            'service-3-desc': 'è¿½æ±‚é«˜å“è´¨çš„è§†è§‰å‘ˆçŽ°ä¸Žè‰ºæœ¯åˆ›æ–°',
            'skills-title': 'ðŸ› ï¸ æŠ€èƒ½ä¸“é•¿',
            'software-title': 'è½¯ä»¶å·¥å…·',
            'art-skills-title': 'è‰ºæœ¯æŠ€èƒ½',
            'art-skill-1': 'æ•°å­—ç»˜ç”»',
            'art-skill-2': '3Då»ºæ¨¡',
            'art-skill-3': 'è§†è§‰å™äº‹',
            'art-skill-4': 'è‰²å½©ç†è®º',
            'achievements-title': 'ðŸ† ä¸»è¦æˆå°±',
            'achievement-1': 'ArtCenter Merit å¥–å­¦é‡‘èŽ·å¾—è€…',
            'achievement-2': 'ä¸ªäººæ’ç”»å§”æ‰˜é¡¹ç›® 100%æ»¡æ„åº¦äº¤ä»˜',
            'achievement-3': 'åŽŸåˆ›è§’è‰²è®¾è®¡å…¥é€‰æ ¡çº§è‰ºæœ¯å±•è§ˆ',
            'portfolio-title': 'ä½œå“é›†',
            'tab-all': 'å…¨éƒ¨',
            'tab-personal': 'ä¸ªäººä½œå“',
            'tab-school': 'å­¦æ ¡ä½œå“',
            'tab-sketch': 'é€Ÿå†™',
            'back-home': 'è¿”å›žä¸»é¡µ',
            'project-details': 'é¡¹ç›®è¯¦æƒ…',
            
            // ä½œå“é¡¹ç›®æ ‡é¢˜å’Œæè¿°
            'unknown-sphere-title': 'æœªçŸ¥æ–°çƒ',
            'unknown-sphere-desc': 'æœªæ¥ç§‘æŠ€æ¦‚å¿µåœºæ™¯',
            'sakura-village-title': 'æ¨±èŠ±æ‘',
            'sakura-village-desc': 'çŽ¯å¢ƒæ¦‚å¿µè®¾è®¡',
            'world-tree-title': 'ä¸–ç•Œæ ‘',
            'world-tree-desc': 'æ¦‚å¿µè®¾è®¡',
            'temple-title': 'å¯ºåº™',
            'temple-desc': 'å»ºç­‘æ¦‚å¿µè®¾è®¡',
            'abandoned-town-title': 'åºŸå¼ƒå°é•‡',
            'abandoned-town-desc': 'ä¸ªäººæ¦‚å¿µè®¾è®¡ä½œå“',
            'mysterious-forest-title': 'ç¥žç§˜æ£®æž—',
            'mysterious-forest-desc': 'ä¸ªäººçŽ¯å¢ƒè®¾è®¡ä½œå“',
            'vis-dev-title': 'è§†è§‰å¼€å‘å…¨é›†',
            'vis-dev-desc': 'è§’è‰²ã€é“å…·ä¸ŽçŽ¯å¢ƒ',
            'creative-perspective-title': 'åˆ›æ„é€è§†æµç¨‹',
            'creative-perspective-desc': 'ä»Žè‰å›¾åˆ°æœ€ç»ˆä½œå“',
            'character-sketch-title': 'è§’è‰²ç´ æ',
            'character-sketch-desc': 'è®¾è®¡ä¸ŽåŠ¨ä½œè¡¨æƒ…ç ”ç©¶',
            'bg-painting-title': 'èƒŒæ™¯ç»˜ç”»',
            'bg-painting-desc': 'ArtCenter è¯¾ç¨‹ä½œä¸š',
            'creative-perspective-simple-title': 'åˆ›æ„é€è§†',
            'creative-perspective-simple-desc': 'çŽ¯å¢ƒè®¾è®¡è¯¾ç¨‹ä½œä¸š',
            'maya-3d-title': 'Maya 3Då»ºæ¨¡',
            'maya-3d-desc': '3Då»ºæ¨¡è¯¾ç¨‹ä½œä¸š',
            'vis-dev-simple-title': 'è§†è§‰å¼€å‘',
            'vis-dev-simple-desc': 'è§†è§‰å¼€å‘è¯¾ç¨‹ä½œä¸š',
            'cat-diary-title': 'çŒ«å’ªæ—¥è®°',
            'cat-diary-desc': 'è§’è‰²è®¾è®¡è¯¾ç¨‹ä½œä¸š',
            'photoshop-basics-title': 'PhotoshopåŸºç¡€',
            'photoshop-basics-desc': 'æ•°å­—ç»˜ç”»è¯¾ç¨‹ä½œä¸š',
            'sketch-video1-title': 'é€Ÿå†™è¿‡ç¨‹1',
            'sketch-video1-desc': 'åˆ›ä½œè¿‡ç¨‹è®°å½•',
            'sketch-video2-title': 'é€Ÿå†™è¿‡ç¨‹2',
            'sketch-video2-desc': 'åˆ›ä½œè¿‡ç¨‹è®°å½•',
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
            'about-location': 'ðŸ“ Shanghai Â· Los Angeles | ðŸŽ“ Studying at ArtCenter College of Design',
            'about-traits-title': 'ðŸŒŸ Personal Traits',
            'trait-1': 'Fast Learner',
            'trait-2': 'Tech Explorer',
            'trait-3': 'Creative Thinker',
            'trait-4': 'Gaming Enthusiast',
            'trait-5': 'Entertainment Industry Researcher',
            'trait-6': 'Cross-media Creator',
            'services-title': 'ðŸŽ¯ Professional Services',
            'service-1-title': 'Character/Environment Concept Design',
            'service-1-desc': 'Creating unique and vibrant character and environment designs',
            'service-2-title': 'World-building Visual Development',
            'service-2-desc': 'Blending Eastern traditional aesthetics with modern digital technology',
            'service-3-title': 'Creative Design Collaboration',
            'service-3-desc': 'Pursuing high-quality visual presentation and artistic innovation',
            'skills-title': 'ðŸ› ï¸ Skills & Expertise',
            'software-title': 'Software Tools',
            'art-skills-title': 'Art Skills',
            'art-skill-1': 'Digital Painting',
            'art-skill-2': '3D Modeling',
            'art-skill-3': 'Visual Storytelling',
            'art-skill-4': 'Color Theory',
            'achievements-title': 'ðŸ† Key Achievements',
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
            
            // ä½œå“é¡¹ç›®æ ‡é¢˜å’Œæè¿°ï¼ˆè‹±æ–‡ï¼‰
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

    // ç»Ÿä¸€çš„ç¿»è¯‘æ›´æ–°å‡½æ•°
    function updateAllTranslations() {
        // ä»Žæœ¬åœ°å­˜å‚¨èŽ·å–å½“å‰è¯­è¨€è®¾ç½®
        const currentLang = localStorage.getItem('preferredLanguage') || 'zh';
        console.log('åº”ç”¨å…¨å±€ç¿»è¯‘ - å½“å‰è¯­è¨€:', currentLang);
        
        // ç¿»è¯‘æ‰€æœ‰æœ‰data-translateå±žæ€§çš„å…ƒç´ 
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (globalTranslations[currentLang] && globalTranslations[currentLang][key]) {
                // å¦‚æžœåŒ…å«HTMLï¼Œä½¿ç”¨innerHTMLï¼Œå¦åˆ™ä½¿ç”¨textContent
                if (globalTranslations[currentLang][key].includes('<')) {
                    element.innerHTML = globalTranslations[currentLang][key];
                } else {
                    element.textContent = globalTranslations[currentLang][key];
                }
                console.log(`å·²ç¿»è¯‘: ${key} -> ${globalTranslations[currentLang][key].substring(0, 15)}${globalTranslations[currentLang][key].length > 15 ? '...' : ''}`);
            }
        });
        
        // æ›´æ–°æ‰€æœ‰è¯­è¨€æŒ‰é’®çš„çŠ¶æ€
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === currentLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // ç¡®ä¿è¯­è¨€è®¾ç½®åœ¨æ•´ä¸ªç½‘ç«™ä¿æŒä¸€è‡´
    function initTranslation() {
        // ä»Žæœ¬åœ°å­˜å‚¨èŽ·å–å½“å‰è¯­è¨€è®¾ç½®
        const currentLang = localStorage.getItem('preferredLanguage') || 'zh';
        console.log('åˆå§‹åŒ–ç¿»è¯‘ - æ£€æµ‹åˆ°è¯­è¨€:', currentLang);

        // è®¾ç½®HTMLè¯­è¨€å±žæ€§
        document.documentElement.lang = currentLang;
        
        // ç«‹å³åº”ç”¨ç¿»è¯‘
        updateAllTranslations();
        
        // è®¾ç½®æ‰€æœ‰è¯­è¨€æŒ‰é’®çŠ¶æ€
        document.querySelectorAll('.lang-btn').forEach(btn => {
            // æ¸…é™¤æ‰€æœ‰ä¹‹å‰çš„äº‹ä»¶ç›‘å¬å™¨
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // è®¾ç½®æ´»åŠ¨çŠ¶æ€
            if (newBtn.getAttribute('data-lang') === currentLang) {
                newBtn.classList.add('active');
            } else {
                newBtn.classList.remove('active');
            }
            
            // æ·»åŠ æ–°çš„äº‹ä»¶ç›‘å¬å™¨
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const lang = this.getAttribute('data-lang');
                console.log(`ç‚¹å‡»è¯­è¨€æŒ‰é’®: ${lang}`);
                
                // ä¿å­˜è¯­è¨€è®¾ç½®
                localStorage.setItem('preferredLanguage', lang);
                
                // åˆ·æ–°é¡µé¢ä»¥åº”ç”¨æ–°è¯­è¨€
                window.location.reload();
                
                return false;
            });
        });
    }

    // åœ¨DOMåŠ è½½å®ŒæˆåŽç«‹å³åˆå§‹åŒ–ç¿»è¯‘
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTranslation);
    } else {
        // å¦‚æžœDOMå·²ç»åŠ è½½å®Œæˆï¼Œç«‹å³æ‰§è¡Œ
        initTranslation();
    }

    // ä¸ºäº†ç¡®ä¿ç¿»è¯‘åœ¨å®Œå…¨åŠ è½½åŽæ­£ç¡®åº”ç”¨
    window.addEventListener('load', function() {
        console.log('Window load: å†æ¬¡æ£€æŸ¥å¹¶åº”ç”¨ç¿»è¯‘');
        // å»¶è¿Ÿæ‰§è¡Œä»¥ç¡®ä¿æ‰€æœ‰DOMå…ƒç´ éƒ½å·²å®Œå…¨åŠ è½½å’Œæ¸²æŸ“
        setTimeout(updateAllTranslations, 100);
        
        // æ·»åŠ æŠ€èƒ½å±•ç¤ºåŒºåŸŸè¿›åº¦æ¡åŠ¨ç”»
        const progressBars = document.querySelectorAll('.progress-bar');
        const skillsSection = document.getElementById('skills-showcase');
        
        if (skillsSection && progressBars.length > 0) {
            // åˆå§‹åŒ–è¿›åº¦æ¡å®½åº¦ä¸º0
            progressBars.forEach(bar => {
                bar.style.width = '0%';
            });
            
            // æ£€æŸ¥å…ƒç´ æ˜¯å¦åœ¨è§†å£ä¸­
            function isElementInViewport(el) {
                const rect = el.getBoundingClientRect();
                return (
                    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.bottom >= 0
                );
            }
            
            // åŠ¨ç”»å‡½æ•°
            function animateProgressBars() {
                if (isElementInViewport(skillsSection)) {
                    progressBars.forEach(bar => {
                        const targetWidth = bar.getAttribute('style').split('width:')[1].trim().split('%')[0];
                        bar.style.width = targetWidth + '%';
                    });
                    // ç§»é™¤æ»šåŠ¨ç›‘å¬ï¼Œé¿å…é‡å¤è§¦å‘
                    window.removeEventListener('scroll', animateProgressBars);
                }
            }
            
            // æ·»åŠ æ»šåŠ¨ç›‘å¬
            window.addEventListener('scroll', animateProgressBars);
            
            // åˆå§‹æ£€æŸ¥
            animateProgressBars();
        }
    });

    // æ·»åŠ è°ƒè¯•å‡½æ•°
    window.forceTranslate = function(lang) {
        if (lang && (lang === 'zh' || lang === 'en')) {
            localStorage.setItem('preferredLanguage', lang);
            updateAllTranslations();
            console.log(`å·²å¼ºåˆ¶åˆ‡æ¢è¯­è¨€åˆ°: ${lang}`);
        } else {
            console.log('å½“å‰è¯­è¨€è®¾ç½®:', localStorage.getItem('preferredLanguage') || 'zh');
            updateAllTranslations();
        }
    };

    // OpenModalå‡½æ•°åº”è¯¥åœ¨å…¨å±€ä½œç”¨åŸŸå®šä¹‰ï¼Œä»¥ä¾¿åœ¨æ‰€æœ‰é¡µé¢ä½¿ç”¨
    function openModal(imageSrc, imageAlt, title, description) {
        console.log('Opening modal for:', title);
        
        // èŽ·å–å½“å‰è¯­è¨€è®¾ç½®
        const currentLang = localStorage.getItem('preferredLanguage') || 'zh';
        console.log('Current language:', currentLang);
        
        const projectModal = document.getElementById('projectModal');
        const modalGallery = document.getElementById('modalGallery');
        const modalDescription = document.getElementById('modalDescription');
        const modalTitle = document.querySelector('.modal-title');
        
        if (!projectModal || !modalGallery || !modalDescription) {
            console.error('Modal elements not found');
            return;
        }
        
        // æ¸…ç©ºæ—§å†…å®¹
        modalGallery.innerHTML = '';
        modalDescription.innerHTML = '';
        
        // æ·»åŠ å›¾ç‰‡æˆ–è§†é¢‘
        if (imageSrc) {
            if (imageSrc.includes('.mp4')) {
                // å¦‚æžœæ˜¯è§†é¢‘
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
                // å¦‚æžœæ˜¯å›¾ç‰‡
                const img = document.createElement('img');
                img.src = imageSrc;
                img.alt = title;
                img.className = 'full-width-image';
                modalGallery.appendChild(img);
            }
        }
        
        // æ›´æ–°æ¨¡æ€æ¡†æ ‡é¢˜
        if (modalTitle) {
            modalTitle.textContent = currentLang === 'zh' ? 'é¡¹ç›®è¯¦æƒ…' : 'Project Details';
        }
        
        // èŽ·å–é¡¹ç›®å†…å®¹ - ç›´æŽ¥ä»Žå†…å®¹æ•°æ®å¯¹è±¡èŽ·å–
        let content = null;
        if (contentData[title] && contentData[title][currentLang]) {
            content = contentData[title][currentLang];
            console.log('Content found for', title, 'in', currentLang);
        } else {
            console.log('No content found for', title, 'in', currentLang);
            // å¦‚æžœæ‰¾ä¸åˆ°å†…å®¹ï¼Œä½¿ç”¨åŸºæœ¬æè¿°
            if (currentLang === 'zh') {
                content = `
                    <h3>${title} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>${description || 'æš‚æ— è¯¦ç»†æè¿°'}</p>
                `;
            } else {
                const enTitle = titleMap[title] || title;
                content = `
                    <h3>${enTitle} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>${description || 'No detailed description available'}</p>
                `;
            }
        }
        
        // æ˜¾ç¤ºå†…å®¹
        modalDescription.innerHTML = content;
        
        // æ·»åŠ è¯­è¨€åˆ‡æ¢æŒ‰é’®
        const buttonContainer = document.createElement('div');
        buttonContainer.style.textAlign = 'center';
        buttonContainer.style.marginTop = '20px';
        
        const switchButton = document.createElement('button');
        switchButton.textContent = currentLang === 'zh' ? 'English Version' : 'ä¸­æ–‡ç‰ˆæœ¬';
        switchButton.style.padding = '8px 15px';
        switchButton.style.background = '#2a2a2a';
        switchButton.style.color = '#fff';
        switchButton.style.border = '1px solid #555';
        switchButton.style.borderRadius = '4px';
        switchButton.style.cursor = 'pointer';
        
        switchButton.onclick = function() {
            // åˆ‡æ¢è¯­è¨€
            const otherLang = currentLang === 'zh' ? 'en' : 'zh';
            
            // èŽ·å–å…¶ä»–è¯­è¨€çš„å†…å®¹
            let otherContent = null;
            if (contentData[title] && contentData[title][otherLang]) {
                otherContent = contentData[title][otherLang];
                console.log('Content found for', title, 'in', otherLang);
            } else {
                console.log('No content found for', title, 'in', otherLang);
                // å¦‚æžœæ‰¾ä¸åˆ°å†…å®¹ï¼Œä½¿ç”¨åŸºæœ¬æè¿°
                if (otherLang === 'zh') {
                    otherContent = `
                        <h3>${title} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                        <p>${description || 'æš‚æ— è¯¦ç»†æè¿°'}</p>
                    `;
                } else {
                    const enTitle = titleMap[title] || title;
                    otherContent = `
                        <h3>${enTitle} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                        <p>${description || 'No detailed description available'}</p>
                    `;
                }
            }
            
            // æ›´æ–°æ¨¡æ€æ¡†æ ‡é¢˜
            if (modalTitle) {
                modalTitle.textContent = otherLang === 'zh' ? 'é¡¹ç›®è¯¦æƒ…' : 'Project Details';
            }
            
            // æ›´æ–°å†…å®¹
            modalDescription.innerHTML = otherContent;
            
            // æ·»åŠ æ–°çš„è¯­è¨€åˆ‡æ¢æŒ‰é’®
            const newButtonContainer = document.createElement('div');
            newButtonContainer.style.textAlign = 'center';
            newButtonContainer.style.marginTop = '20px';
            
            const newSwitchButton = document.createElement('button');
            newSwitchButton.textContent = otherLang === 'zh' ? 'English Version' : 'ä¸­æ–‡ç‰ˆæœ¬';
            newSwitchButton.style.padding = '8px 15px';
            newSwitchButton.style.background = '#2a2a2a';
            newSwitchButton.style.color = '#fff';
            newSwitchButton.style.border = '1px solid #555';
            newSwitchButton.style.borderRadius = '4px';
            newSwitchButton.style.cursor = 'pointer';
            
            // é—­åŒ…ä¿å­˜å½“å‰çŠ¶æ€
            newSwitchButton.onclick = (function(origLang) {
                return function() {
                    // æ¢å¤åŽŸå§‹è¯­è¨€å†…å®¹
                    if (modalTitle) {
                        modalTitle.textContent = origLang === 'zh' ? 'é¡¹ç›®è¯¦æƒ…' : 'Project Details';
                    }
                    
                    modalDescription.innerHTML = content;
                    modalDescription.appendChild(buttonContainer);
                };
            })(currentLang);
            
            newButtonContainer.appendChild(newSwitchButton);
            modalDescription.appendChild(newButtonContainer);
        };
        
        buttonContainer.appendChild(switchButton);
        modalDescription.appendChild(buttonContainer);
        
        // æ˜¾ç¤ºæ¨¡æ€æ¡†
        projectModal.style.display = 'flex';
        
        // å…³é—­æ¨¡æ€æ¡†çš„ç‚¹å‡»äº‹ä»¶
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.onclick = function() {
                projectModal.style.display = 'none';
                
                // å¦‚æžœæœ‰è§†é¢‘ï¼Œæš‚åœè§†é¢‘æ’­æ”¾
                const videos = projectModal.querySelectorAll('video');
                videos.forEach(video => video.pause());
            };
        }
        
        // ç‚¹å‡»æ¨¡æ€æ¡†å¤–éƒ¨å…³é—­
        window.onclick = function(event) {
            if (event.target === projectModal) {
                projectModal.style.display = 'none';
                
                // å¦‚æžœæœ‰è§†é¢‘ï¼Œæš‚åœè§†é¢‘æ’­æ”¾
                const videos = projectModal.querySelectorAll('video');
                videos.forEach(video => video.pause());
            }
        };
    }

    // æ·»åŠ ä¸€ä¸ªä¸“é—¨ç”¨äºŽæ˜¾ç¤ºè‹±æ–‡æ¨¡æ€æ¡†çš„å‡½æ•°
    function openEnglishModal(imageSrc, imageAlt, title, description) {
        console.log('Opening English modal for:', title);
        
        const enProjectModal = document.getElementById('enProjectModal');
        const enModalGallery = document.getElementById('enModalGallery');
        const enModalDescription = document.getElementById('enModalDescription');
        
        if (!enProjectModal || !enModalGallery || !enModalDescription) {
            console.error('English modal elements not found');
            return;
        }
        
        // æ¸…ç©ºæ—§å†…å®¹
        enModalGallery.innerHTML = '';
        enModalDescription.innerHTML = '';
        
        // æ·»åŠ å›¾ç‰‡æˆ–è§†é¢‘
        if (imageSrc) {
            if (imageSrc.includes('.mp4')) {
                // å¦‚æžœæ˜¯è§†é¢‘
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
                // å¦‚æžœæ˜¯å›¾ç‰‡
                const img = document.createElement('img');
                img.src = imageSrc;
                img.alt = title;
                img.className = 'full-width-image';
                enModalGallery.appendChild(img);
            }
        }
        
        // èŽ·å–è‹±æ–‡å†…å®¹
        console.log('Getting English content for title:', title);
        
        let enContent = getEnContent(title);
        
        // å¦‚æžœæ‰¾ä¸åˆ°è‹±æ–‡å†…å®¹ï¼Œå°è¯•ä½¿ç”¨ç¿»è¯‘åŽçš„æ ‡é¢˜æŸ¥æ‰¾
        if (!enContent) {
            const enKey = translateTitleToEn(title);
            if (enKey && enKey !== title) {
                enContent = getEnContent(enKey);
                console.log('Trying translated title:', title, '->', enKey, 'Result:', !!enContent);
            }
        }
        
        // æ˜¾ç¤ºå†…å®¹
        if (enContent) {
            enModalDescription.innerHTML = enContent;
            console.log('Found and displaying English content');
        } else {
            // å¦‚æžœæ²¡æœ‰é¢„å®šä¹‰çš„è‹±æ–‡å†…å®¹ï¼Œä½¿ç”¨ç¿»è¯‘åŽçš„åŸºæœ¬æè¿°
            console.log('No predefined English content found, showing translated basic description');
            
            const enTitle = translateTitleToEn(title) || title || '';
            const enDesc = translateDescToEn(description) || description || 'No detailed description available';
            
            enModalDescription.innerHTML = `
                <h3>${enTitle} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                <p>${enDesc}</p>
            `;
        }
        
        // æ·»åŠ è¯­è¨€åˆ‡æ¢æŒ‰é’®
        const buttonContainer = document.createElement('div');
        buttonContainer.style.textAlign = 'center';
        buttonContainer.style.marginTop = '20px';
        
        const switchToChinese = document.createElement('button');
        switchToChinese.textContent = 'åˆ‡æ¢åˆ°ä¸­æ–‡ / Switch to Chinese';
        switchToChinese.style.padding = '8px 15px';
        switchToChinese.style.background = '#2a2a2a';
        switchToChinese.style.color = '#fff';
        switchToChinese.style.border = '1px solid #555';
        switchToChinese.style.borderRadius = '4px';
        switchToChinese.style.cursor = 'pointer';
        
        switchToChinese.onclick = function() {
            enProjectModal.style.display = 'none';
            openModal(imageSrc, imageAlt, title, description);
        };
        
        buttonContainer.appendChild(switchToChinese);
        enModalDescription.appendChild(buttonContainer);
        
        // æ˜¾ç¤ºè‹±æ–‡æ¨¡æ€æ¡†
        enProjectModal.style.display = 'flex';
        
        // å…³é—­æŒ‰é’®äº‹ä»¶
        const closeBtn = enProjectModal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = function() {
                enProjectModal.style.display = 'none';
                // å¦‚æžœæœ‰è§†é¢‘ï¼Œæš‚åœè§†é¢‘æ’­æ”¾
                const videos = enProjectModal.querySelectorAll('video');
                videos.forEach(video => video.pause());
            };
        }
        
        // ç‚¹å‡»æ¨¡æ€æ¡†å¤–éƒ¨å…³é—­
        window.onclick = function(event) {
            if (event.target === enProjectModal) {
                enProjectModal.style.display = 'none';
                // å¦‚æžœæœ‰è§†é¢‘ï¼Œæš‚åœè§†é¢‘æ’­æ”¾
                const videos = enProjectModal.querySelectorAll('video');
                videos.forEach(video => video.pause());
            }
        };
    }

    // æ·»åŠ æ¨¡æ€æ¡†è¯­è¨€åˆ‡æ¢æŒ‰é’®çš„æ ·å¼
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

    // æ³¨å†Œé¡¹ç›®ç‚¹å‡»äº‹ä»¶
    function registerProjectEvents() {
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        
        if (portfolioItems.length > 0) {
            console.log('Registering click events for', portfolioItems.length, 'portfolio items');
            
            portfolioItems.forEach(item => {
                // é¿å…é‡å¤æ·»åŠ äº‹ä»¶ç›‘å¬å™¨
                if (!item.hasAttribute('data-event-registered')) {
                    item.setAttribute('data-event-registered', 'true');
                    
                    item.addEventListener('click', function() {
                        const imgElement = this.querySelector('img') || this.querySelector('video');
                        const imgSrc = imgElement?.src;
                        const title = this.querySelector('.portfolio-overlay h3').textContent;
                        const desc = this.querySelector('.portfolio-overlay p').textContent;
                        
                        console.log('Opening modal for:', title);
                        
                        // èŽ·å–å½“å‰è¯­è¨€è®¾ç½®
                        const currentLang = localStorage.getItem('preferredLanguage') || 'zh';
                        
                        // èŽ·å–æ¨¡æ€æ¡†å…ƒç´ 
                        const projectModal = document.getElementById('projectModal');
                        const modalTitle = projectModal.querySelector('.modal-title');
                        const modalGallery = document.getElementById('modalGallery');
                        const modalDescription = document.getElementById('modalDescription');
                        
                        // æ¸…ç©ºæ—§å†…å®¹
                        modalGallery.innerHTML = '';
                        modalDescription.innerHTML = '';
                        
                        // è®¾ç½®æ¨¡æ€æ¡†æ ‡é¢˜
                        if (modalTitle) {
                            modalTitle.textContent = currentLang === 'zh' ? 'é¡¹ç›®è¯¦æƒ…' : 'Project Details';
                        }
                        
                        // æ·»åŠ å›¾ç‰‡æˆ–è§†é¢‘
                        if (imgSrc) {
                            if (imgSrc.includes('.mp4')) {
                                // å¦‚æžœæ˜¯è§†é¢‘
                                const videoContainer = document.createElement('div');
                                videoContainer.className = 'modal-video-container';
                                
                                const video = document.createElement('video');
                                video.src = imgSrc;
                                video.controls = true;
                                
                                const poster = imgSrc.includes('#t=') ? imgSrc : imgSrc.replace('.mp4', '.png');
                                video.poster = poster;
                                
                                videoContainer.appendChild(video);
                                modalGallery.appendChild(videoContainer);
                            } else {
                                // å¦‚æžœæ˜¯å›¾ç‰‡
                                const img = document.createElement('img');
                                img.src = imgSrc;
                                img.alt = title;
                                img.className = 'full-width-image';
                                modalGallery.appendChild(img);
                            }
                        }
                        
                        // èŽ·å–é¡¹ç›®å†…å®¹
                        let content;
                        if (currentLang === 'zh') {
                            // èŽ·å–ä¸­æ–‡å†…å®¹
                            content = getZhContent(title);
                        } else {
                            // èŽ·å–è‹±æ–‡å†…å®¹
                            content = getEnContent(title);
                            // å¦‚æžœæ‰¾ä¸åˆ°è‹±æ–‡å†…å®¹ï¼Œå°è¯•ä½¿ç”¨ç¿»è¯‘åŽçš„æ ‡é¢˜æŸ¥æ‰¾
                            if (!content && typeof translateTitleToEn === 'function') {
                                const enTitle = translateTitleToEn(title);
                                if (enTitle && enTitle !== title) {
                                    content = getEnContent(enTitle);
                                }
                            }
                        }
                        
                        // å¦‚æžœæ‰¾ä¸åˆ°é¢„å®šä¹‰å†…å®¹ï¼Œä½¿ç”¨åŸºæœ¬æè¿°
                        if (!content) {
                            if (currentLang === 'zh') {
                                content = `
                                    <h3>${title} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                                    <p>${desc || 'æš‚æ— è¯¦ç»†æè¿°'}</p>
                                `;
                            } else {
                                const enTitle = typeof translateTitleToEn === 'function' ? translateTitleToEn(title) || title : title;
                                const enDesc = typeof translateDescToEn === 'function' ? translateDescToEn(desc) || desc : desc;
                                content = `
                                    <h3>${enTitle} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                                    <p>${enDesc || 'No detailed description available'}</p>
                                `;
                            }
                        }
                        
                        // æ˜¾ç¤ºå†…å®¹
                        modalDescription.innerHTML = content;
                        
                        // æ·»åŠ è¯­è¨€åˆ‡æ¢æŒ‰é’®
                        const buttonContainer = document.createElement('div');
                        buttonContainer.style.textAlign = 'center';
                        buttonContainer.style.marginTop = '20px';
                        
                        const switchButton = document.createElement('button');
                        switchButton.textContent = currentLang === 'zh' ? 'English Version' : 'ä¸­æ–‡ç‰ˆæœ¬';
                        switchButton.style.padding = '8px 15px';
                        switchButton.style.background = '#2a2a2a';
                        switchButton.style.color = '#fff';
                        switchButton.style.border = '1px solid #555';
                        switchButton.style.borderRadius = '4px';
                        switchButton.style.cursor = 'pointer';
                        
                        switchButton.onclick = function() {
                            // èŽ·å–ç›¸åè¯­è¨€çš„å†…å®¹
                            const otherLang = currentLang === 'zh' ? 'en' : 'zh';
                            let otherContent;
                            
                            if (otherLang === 'zh') {
                                // èŽ·å–ä¸­æ–‡å†…å®¹
                                otherContent = getZhContent(title);
                            } else {
                                // èŽ·å–è‹±æ–‡å†…å®¹
                                otherContent = getEnContent(title);
                                // å¦‚æžœæ‰¾ä¸åˆ°è‹±æ–‡å†…å®¹ï¼Œå°è¯•ä½¿ç”¨ç¿»è¯‘åŽçš„æ ‡é¢˜æŸ¥æ‰¾
                                if (!otherContent && typeof translateTitleToEn === 'function') {
                                    const enTitle = translateTitleToEn(title);
                                    if (enTitle && enTitle !== title) {
                                        otherContent = getEnContent(enTitle);
                                    }
                                }
                            }
                            
                            // å¦‚æžœæ‰¾ä¸åˆ°é¢„å®šä¹‰å†…å®¹ï¼Œä½¿ç”¨åŸºæœ¬æè¿°
                            if (!otherContent) {
                                if (otherLang === 'zh') {
                                    otherContent = `
                                        <h3>${title} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                                        <p>${desc || 'æš‚æ— è¯¦ç»†æè¿°'}</p>
                                    `;
                                } else {
                                    const enTitle = typeof translateTitleToEn === 'function' ? translateTitleToEn(title) || title : title;
                                    const enDesc = typeof translateDescToEn === 'function' ? translateDescToEn(desc) || desc : desc;
                                    otherContent = `
                                        <h3>${enTitle} <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                                        <p>${enDesc || 'No detailed description available'}</p>
                                    `;
                                }
                            }
                            
                            // æ›´æ–°æ¨¡æ€æ¡†æ ‡é¢˜
                            if (modalTitle) {
                                modalTitle.textContent = otherLang === 'zh' ? 'é¡¹ç›®è¯¦æƒ…' : 'Project Details';
                            }
                            
                            // æ›´æ–°å†…å®¹
                            modalDescription.innerHTML = otherContent;
                            
                            // æ›´æ–°æŒ‰é’®æ–‡æœ¬
                            this.textContent = otherLang === 'zh' ? 'English Version' : 'ä¸­æ–‡ç‰ˆæœ¬';
                            
                            // é‡æ–°æ·»åŠ æŒ‰é’®
                            modalDescription.appendChild(buttonContainer);
                        };
                        
                        buttonContainer.appendChild(switchButton);
                        modalDescription.appendChild(buttonContainer);
                        
                        // æ˜¾ç¤ºæ¨¡æ€æ¡†
                        projectModal.style.display = 'flex';
                        
                        // å…³é—­æ¨¡æ€æ¡†çš„ç‚¹å‡»äº‹ä»¶
                        const closeModal = projectModal.querySelector('.close-modal');
                        if (closeModal) {
                            closeModal.onclick = function() {
                                projectModal.style.display = 'none';
                                
                                // å¦‚æžœæœ‰è§†é¢‘ï¼Œæš‚åœè§†é¢‘æ’­æ”¾
                                const videos = projectModal.querySelectorAll('video');
                                videos.forEach(video => {
                                    video.pause();
                                });
                            };
                        }
                        
                        // ç‚¹å‡»æ¨¡æ€æ¡†å¤–éƒ¨å…³é—­
                        window.onclick = function(event) {
                            if (event.target === projectModal) {
                                projectModal.style.display = 'none';
                                
                                // å¦‚æžœæœ‰è§†é¢‘ï¼Œæš‚åœè§†é¢‘æ’­æ”¾
                                const videos = projectModal.querySelectorAll('video');
                                videos.forEach(video => {
                                    video.pause();
                                });
                            }
                        };
                    });
                    
                    // æ·»åŠ cursor-pointerç±»ä»¥æ˜¾ç¤ºç‚¹å‡»æ•ˆæžœ
                    item.classList.add('cursor-pointer');
                }
            });
        }
    }

    // åˆå§‹åŒ–
    document.addEventListener('DOMContentLoaded', function() {
        // ä»ŽlocalStorageèŽ·å–è¯­è¨€è®¾ç½®ï¼Œå¦‚æžœæ²¡æœ‰åˆ™é»˜è®¤ä¸ºä¸­æ–‡
        const preferredLanguage = localStorage.getItem('preferredLanguage') || 'zh';
        console.log('Current language setting:', preferredLanguage);
        
        // æ›´æ–°æŒ‰é’®çŠ¶æ€
        const zhBtn = document.querySelector('.language-btn[data-lang="zh"]');
        const enBtn = document.querySelector('.language-btn[data-lang="en"]');
        
        if (zhBtn && enBtn) {
            if (preferredLanguage === 'zh') {
                zhBtn.classList.add('active');
                enBtn.classList.remove('active');
            } else {
                zhBtn.classList.remove('active');
                enBtn.classList.add('active');
            }
        }
        
        // æ·»åŠ è¯­è¨€æŒ‰é’®çš„ç‚¹å‡»äº‹ä»¶
        const langButtons = document.querySelectorAll('.language-btn');
        
        langButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const lang = this.getAttribute('data-lang');
                localStorage.setItem('preferredLanguage', lang);
                
                // åˆ·æ–°é¡µé¢ä»¥åº”ç”¨æ–°çš„è¯­è¨€è®¾ç½®
                location.reload();
            });
        });
        
        // æ³¨å†Œé¡¹ç›®ç‚¹å‡»äº‹ä»¶
        registerProjectEvents();
    });

    // æ·»åŠ è‹±æ–‡å†…å®¹èŽ·å–å‡½æ•°
    function getEnContent(key) {
        console.log("Getting English content for key:", key);
        // æ ¹æ®keyè¿”å›žå¯¹åº”çš„è‹±æ–‡å†…å®¹HTML
        switch(key) {
            case 'è‰ºæœ¯å®¶':
            case 'Artist':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This is an original character design project that explores unique artistic styles and character representation.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>This character embodies my artistic style, combining elegance with expressiveness. I aimed to create a character with a strong personality and visual impact, while keeping a sense of mystery and depth.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>I utilized advanced digital painting techniques, focusing on color harmony, lighting, and detailed rendering. The character design process involved extensive research and multiple iterations to achieve the perfect balance between aesthetics and character storytelling.</p>
                `;

            case 'æœªçŸ¥æ–°çƒ':
            case 'Unknown Sphere':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This is a futuristic concept scene exploring the interaction between technology and natural environments.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>The "Unknown Sphere" concept explores the mystery of advanced technology in natural settings. The design aims to create a sense of wonder and scientific curiosity through the contrast between the organic forest environment and the geometric, technological sphere.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>I focused on creating a realistic lighting scenario with dramatic fog effects to enhance the mysterious atmosphere. The technical challenge involved balancing the organic forest elements with the hard-surface design of the sphere, while maintaining visual coherence through color harmony and atmospheric perspective.</p>
                `;

            case 'æ¨±èŠ±æ‘':
            case 'Sakura Village':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This environmental concept design depicts a traditional Japanese village during cherry blossom season.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>The "Sakura Village" concept explores the beauty of traditional Japanese architecture harmoniously integrated with the natural environment. I wanted to capture the tranquil and poetic atmosphere of a village during cherry blossom season, emphasizing the cultural significance and aesthetic value of such seasonal moments.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>I carefully constructed the architectural elements following traditional Japanese design principles, while giving special attention to the lighting and atmospheric effects. The pink hues of the cherry blossoms were balanced with the earthy tones of the buildings, creating a harmonious color palette that enhances the emotional impact of the scene.</p>
                `;

            case 'ä¸–ç•Œæ ‘':
            case 'World Tree':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This concept design explores the mythological World Tree, blending magical elements with fantasy aesthetics.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>The "World Tree" concept is inspired by various mythologies where a cosmic tree connects different realms of existence. I aimed to create a design that feels both ancient and magical, emphasizing the tree's role as a bridge between worlds through its luminous features and imposing scale.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>I employed advanced lighting techniques to create the ethereal glow emanating from the tree. The composition was carefully planned to emphasize the massive scale of the tree, while intricate details were added to convey its organic and magical nature. The color palette was chosen to enhance the mystical atmosphere of the scene.</p>
                `;

            case 'å¯ºåº™':
            case 'Temple':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
                    <p>This architectural concept design explores traditional Eastern temple architecture in a contemporary interpretation.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>The temple design is inspired by traditional Eastern sacred architecture, particularly drawing from Chinese and Japanese aesthetic principles. I wanted to create a space that conveys spiritual tranquility while incorporating subtle contemporary design elements that respect the traditional forms.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>The design process involved extensive research on architectural proportions and decorative elements typical in temple construction. Particular attention was paid to the lighting design, using natural light sources to enhance the spatial quality and spiritual atmosphere of the temple. The color palette was deliberately restrained to evoke serenity and contemplation.</p>
                `;

            case 'åºŸå¼ƒå°é•‡':
            case 'Abandoned Town':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
                    <p>This is a personal environment concept design project, exploring the stories and emotions contained within abandoned urban spaces.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>Through this work, I wanted to express the aesthetics of time passing and traces of human activity. The abandoned buildings and gradually encroaching natural elements create a unique visual tension, prompting viewers to reflect on the past and future.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>During the creation process, I paid special attention to the treatment of light and shadow and the creation of atmosphere. Through detailed textures and careful rendering, I gave this abandoned space life and a sense of story. The choice of color tones was also carefully considered to enhance the emotional expression of the scene.</p>
                `;

            case 'æ£®æž—':
            case 'Mysterious Forest':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2025</span></h3>
                    <p>This is a personal environment concept design project, exploring the visual representation and atmosphere creation of a mysterious forest.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>Through this work, I wanted to express the mystery and vitality of nature. The dense vegetation, unique lighting, and treatment of fog together create a forest world that is both dreamlike and real, guiding viewers into a space full of imagination.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>During the creation process, I focused particularly on the effect of light penetrating through leaves and the expression of spatial layering. Through fine brushwork and color gradients, I created a deep yet vibrant forest atmosphere, allowing viewers to feel the mystery and tranquility of nature.</p>
                `;

            case 'è§†è§‰å¼€å‘å…¨é›†':
            case 'Visual Development Collection':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This project involves selecting a movie and designing a series of props, with the challenge of maintaining a unified style across all designs.</p>
                    
                    <h3>Design Philosophy</h3>
                    <p>The key challenge in this project was ensuring stylistic unity across all props. Each item needed to appear as if it belonged to the same world view and aligned with the overall aesthetics of the chosen movie, while still maintaining its unique characteristics and purpose.</p>
                    
                    <h3>Workflow</h3>
                    <p>The process involved analyzing the visual style of the selected movie, creating concept sketches, and ensuring each prop was both unique and cohesive with the overall design. This project demonstrates the ability to maintain consistent design language across multiple items while serving the narrative needs of a larger world-building context.</p>
                `;

            case 'åˆ›æ„é€è§†æµç¨‹':
            case 'Creative Perspective Process':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This project required the use of five-point perspective to create a cyberpunk world scene featuring two characters on a train.</p>
                    
                    <h3>Design Choice</h3>
                    <p>I chose to create a dynamic scene of characters on a futuristic train in a cyberpunk city, utilizing five-point perspective to enhance the dramatic visual impact. This assignment challenged me to apply complex perspective techniques to create an immersive and visually compelling environment.</p>
                    
                    <h3>Technical Points</h3>
                    <p>The project showcases the application of five-point curvilinear perspective, which is particularly effective for creating dramatic wide-angle views. The perspective technique helps create a sense of immersion and depth, while the character placement on the train adds narrative interest and scale reference to the scene. The process from initial sketch to final rendering demonstrates my methodical approach to complex illustration challenges.</p>
                `;

            case 'è§’è‰²ç´ æ':
            case 'Character Sketches':
                return `
                    <h3>Character Sketch Study <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>This project showcases the sketching process for character design and action/expression studies. Through sketching, I deeply explored the character's appearance features and dynamic postures, laying the foundation for subsequent character creation.</p>
                    
                    <h3>Design Points</h3>
                    <p>The project contains two main parts: overall character design and detailed action/expression studies. Through precise sketching of character proportions, clothing, and features, as well as exploration of various expressions and action postures, it comprehensively demonstrates the fundamental work of character design.</p>
                `;

            case 'PhotoshopåŸºç¡€':
            case 'Photoshop Fundamentals':
                return `
                    <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
                    <p>This course project focuses on mastering fundamental Photoshop techniques essential for digital painting and image editing.</p>
                    
                    <h3>Learning Objectives</h3>
                    <p>The main goal was to develop proficiency in Photoshop's core tools and workflows, including layer management, masking, adjustment layers, and digital painting techniques. These skills form the foundation for more advanced digital art creation.</p>
                    
                    <h3>Technical Implementation</h3>
                    <p>The project involved practical exercises in color correction, compositing, and digital painting techniques. Special attention was given to understanding non-destructive workflows and efficient file organization methods that support professional-level digital art production.</p>
                `;

            case 'çŒ«å’ªæ—¥è®°':
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
                console.log("No English content found for key:", key);
                return null;
        }
    }

    function getZhContent(key) {
        console.log("Getting Chinese content for key:", key);
        // æ ¹æ®keyè¿”å›žå¯¹åº”çš„ä¸­æ–‡å†…å®¹HTML
        switch(key) {
            case 'è‰ºæœ¯å®¶':
                return `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>è¿™æ˜¯ä¸€ä¸ªåŽŸåˆ›è§’è‰²è®¾è®¡é¡¹ç›®ï¼ŒæŽ¢ç´¢ç‹¬ç‰¹çš„è‰ºæœ¯é£Žæ ¼å’Œè§’è‰²è¡¨çŽ°ã€‚</p>
                    
                    <h3>è®¾è®¡ç†å¿µ</h3>
                    <p>è¿™ä¸ªè§’è‰²ä½“çŽ°äº†æˆ‘çš„è‰ºæœ¯é£Žæ ¼ï¼Œå°†ä¼˜é›…ä¸Žè¡¨çŽ°åŠ›ç›¸ç»“åˆã€‚æˆ‘æ—¨åœ¨åˆ›é€ ä¸€ä¸ªå…·æœ‰å¼ºçƒˆä¸ªæ€§å’Œè§†è§‰å†²å‡»åŠ›çš„è§’è‰²ï¼ŒåŒæ—¶ä¿æŒç¥žç§˜æ„Ÿå’Œæ·±åº¦ã€‚</p>
                    
                    <h3>æŠ€æœ¯å®žçŽ°</h3>
                    <p>æˆ‘è¿ç”¨äº†å…ˆè¿›çš„æ•°å­—ç»˜ç”»æŠ€æœ¯ï¼Œæ³¨é‡è‰²å½©å’Œè°ã€å…‰å½±å’Œç»†èŠ‚æ¸²æŸ“ã€‚è§’è‰²è®¾è®¡è¿‡ç¨‹æ¶‰åŠå¹¿æ³›çš„ç ”ç©¶å’Œå¤šæ¬¡è¿­ä»£ï¼Œä»¥è¾¾åˆ°ç¾Žå­¦å’Œè§’è‰²å™äº‹çš„å®Œç¾Žå¹³è¡¡ã€‚</p>
                `;

            case 'æœªçŸ¥æ–°çƒ':
                return `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>è¿™æ˜¯ä¸€ä¸ªæœªæ¥æ¦‚å¿µåœºæ™¯ï¼ŒæŽ¢ç´¢ç§‘æŠ€ä¸Žè‡ªç„¶çŽ¯å¢ƒçš„äº’åŠ¨ã€‚</p>
                    
                    <h3>è®¾è®¡ç†å¿µ</h3>
                    <p>"æœªçŸ¥æ–°çƒ"æ¦‚å¿µæŽ¢ç´¢äº†è‡ªç„¶çŽ¯å¢ƒä¸­å…ˆè¿›ç§‘æŠ€çš„ç¥žç§˜æ„Ÿã€‚è®¾è®¡æ—¨åœ¨é€šè¿‡æœ‰æœºæ£®æž—çŽ¯å¢ƒä¸Žå‡ ä½•ç§‘æŠ€çƒä½“çš„å¯¹æ¯”ï¼Œåˆ›é€ ä¸€ç§å¥‡å¦™å’Œç§‘å­¦å¥½å¥‡çš„æ„Ÿè§‰ã€‚</p>
                    
                    <h3>æŠ€æœ¯å®žçŽ°</h3>
                    <p>æˆ‘ä¸“æ³¨äºŽåˆ›é€ å…·æœ‰æˆå‰§æ€§é›¾æ•ˆçš„çœŸå®žå…‰ç…§åœºæ™¯ï¼Œä»¥å¢žå¼ºç¥žç§˜æ°›å›´ã€‚æŠ€æœ¯æŒ‘æˆ˜æ¶‰åŠå¹³è¡¡æœ‰æœºæ£®æž—å…ƒç´ ä¸Žçƒä½“çš„ç¡¬è¡¨é¢è®¾è®¡ï¼ŒåŒæ—¶é€šè¿‡è‰²å½©å’Œè°å’Œå¤§æ°”é€è§†ä¿æŒè§†è§‰è¿žè´¯æ€§ã€‚</p>
                `;

            case 'æ¨±èŠ±æ‘':
                return `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>è¿™æ˜¯ä¸€ä¸ªçŽ¯å¢ƒæ¦‚å¿µè®¾è®¡ï¼Œæç»˜äº†æ¨±èŠ±å­£èŠ‚çš„ä¼ ç»Ÿæ—¥æœ¬æ‘åº„ã€‚</p>
                    
                    <h3>è®¾è®¡ç†å¿µ</h3>
                    <p>"æ¨±èŠ±æ‘"æ¦‚å¿µæŽ¢ç´¢äº†ä¼ ç»Ÿæ—¥æœ¬å»ºç­‘ä¸Žè‡ªç„¶çŽ¯å¢ƒçš„å’Œè°èžåˆã€‚æˆ‘æƒ³æ•æ‰æ¨±èŠ±å­£èŠ‚æ‘åº„çš„å®é™å’Œè¯—æ„æ°›å›´ï¼Œå¼ºè°ƒè¿™ç§å­£èŠ‚æ€§æ—¶åˆ»çš„æ–‡åŒ–æ„ä¹‰å’Œç¾Žå­¦ä»·å€¼ã€‚</p>
                    
                    <h3>æŠ€æœ¯å®žçŽ°</h3>
                    <p>æˆ‘ä»”ç»†æž„å»ºäº†éµå¾ªä¼ ç»Ÿæ—¥æœ¬è®¾è®¡åŽŸåˆ™çš„å»ºç­‘å…ƒç´ ï¼ŒåŒæ—¶ç‰¹åˆ«æ³¨é‡å…‰å½±å’Œå¤§æ°”æ•ˆæžœã€‚æ¨±èŠ±çš„ç²‰è‰²è°ƒä¸Žå»ºç­‘çš„åœŸè‰²è°ƒç›¸å¹³è¡¡ï¼Œåˆ›é€ å‡ºå¢žå¼ºåœºæ™¯æƒ…æ„Ÿå†²å‡»åŠ›çš„å’Œè°è‰²å½©ã€‚</p>
                `;

            case 'ä¸–ç•Œæ ‘':
                return `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
                    <p>è¿™æ˜¯ä¸€ä¸ªæ¦‚å¿µè®¾è®¡ï¼ŒæŽ¢ç´¢ç¥žè¯ä¸­çš„ä¸–ç•Œæ ‘ï¼Œå°†é­”æ³•å…ƒç´ ä¸Žå¥‡å¹»ç¾Žå­¦ç›¸ç»“åˆã€‚</p>
                    
                    <h3>è®¾è®¡ç†å¿µ</h3>
                    <p>"ä¸–ç•Œæ ‘"æ¦‚å¿µçµæ„Ÿæ¥è‡ªå„ç§ç¥žè¯ä¸­è¿žæŽ¥ä¸åŒå­˜åœ¨é¢†åŸŸçš„å®‡å®™æ ‘ã€‚æˆ‘æ—¨åœ¨åˆ›é€ ä¸€ä¸ªæ—¢å¤è€åˆé­”å¹»çš„è®¾è®¡ï¼Œé€šè¿‡å…¶å‘å…‰ç‰¹å¾å’Œå®ä¼Ÿè§„æ¨¡å¼ºè°ƒæ ‘æœ¨ä½œä¸ºä¸–ç•Œæ¡¥æ¢çš„è§’è‰²ã€‚</p>
                    
                    <h3>æŠ€æœ¯å®žçŽ°</h3>
                    <p>æˆ‘è¿ç”¨äº†å…ˆè¿›çš„å…‰ç…§æŠ€æœ¯æ¥åˆ›é€ ä»Žæ ‘æœ¨æ•£å‘å‡ºçš„ç©ºçµå…‰èŠ’ã€‚æž„å›¾ç»è¿‡ç²¾å¿ƒè§„åˆ’ä»¥å¼ºè°ƒæ ‘æœ¨çš„å·¨å¤§è§„æ¨¡ï¼ŒåŒæ—¶æ·»åŠ äº†å¤æ‚çš„ç»†èŠ‚æ¥ä¼ è¾¾å…¶æœ‰æœºå’Œé­”å¹»æ€§è´¨ã€‚è‰²å½©é€‰æ‹©å¢žå¼ºäº†åœºæ™¯çš„ç¥žç§˜æ°›å›´ã€‚</p>
                `;

            case 'å¯ºåº™':
                return `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                    <p>è¿™æ˜¯ä¸€ä¸ªå»ºç­‘æ¦‚å¿µè®¾è®¡ï¼ŒæŽ¢ç´¢ä¼ ç»Ÿä¸œæ–¹å¯ºåº™å»ºç­‘çš„å½“ä»£è¯ é‡Šã€‚</p>
                    
                    <h3>è®¾è®¡ç†å¿µ</h3>
                    <p>å¯ºåº™è®¾è®¡çµæ„Ÿæ¥è‡ªä¼ ç»Ÿä¸œæ–¹ç¥žåœ£å»ºç­‘ï¼Œç‰¹åˆ«å€Ÿé‰´äº†ä¸­å›½å’Œæ—¥æœ¬çš„ç¾Žå­¦åŽŸåˆ™ã€‚æˆ‘æƒ³åˆ›é€ ä¸€ä¸ªä¼ è¾¾ç²¾ç¥žå®é™çš„ç©ºé—´ï¼ŒåŒæ—¶èžå…¥å°Šé‡ä¼ ç»Ÿå½¢å¼çš„å¾®å¦™å½“ä»£è®¾è®¡å…ƒç´ ã€‚</p>
                    
                    <h3>æŠ€æœ¯å®žçŽ°</h3>
                    <p>è®¾è®¡è¿‡ç¨‹æ¶‰åŠå¯¹å¯ºåº™å»ºç­‘ä¸­å…¸åž‹çš„å»ºç­‘æ¯”ä¾‹å’Œè£…é¥°å…ƒç´ çš„å¹¿æ³›ç ”ç©¶ã€‚ç‰¹åˆ«æ³¨é‡ç…§æ˜Žè®¾è®¡ï¼Œåˆ©ç”¨è‡ªç„¶å…‰æºæ¥å¢žå¼ºå¯ºåº™çš„ç©ºé—´è´¨é‡å’Œç²¾ç¥žæ°›å›´ã€‚è‰²å½©æ­é…åˆ»æ„ä¿æŒå…‹åˆ¶ï¼Œä»¥å”¤èµ·å®é™å’Œæ²‰æ€ã€‚</p>
                `;

            case 'åºŸå¼ƒå°é•‡':
                return `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                    <p>è¿™æ˜¯ä¸€ä¸ªä¸ªäººçŽ¯å¢ƒæ¦‚å¿µè®¾è®¡é¡¹ç›®ï¼ŒæŽ¢ç´¢åºŸå¼ƒåŸŽå¸‚ç©ºé—´ä¸­çš„æ•…äº‹å’Œæƒ…æ„Ÿã€‚</p>
                    
                    <h3>è®¾è®¡ç†å¿µ</h3>
                    <p>é€šè¿‡è¿™ä¸ªä½œå“ï¼Œæˆ‘æƒ³è¡¨è¾¾æ—¶é—´æµé€å’Œäººç±»æ´»åŠ¨ç—•è¿¹çš„ç¾Žå­¦ã€‚åºŸå¼ƒçš„å»ºç­‘å’Œé€æ¸ä¾µèš€çš„è‡ªç„¶å…ƒç´ åˆ›é€ å‡ºç‹¬ç‰¹çš„è§†è§‰å¼ åŠ›ï¼Œä¿ƒä½¿è§‚ä¼—åæ€è¿‡åŽ»å’Œæœªæ¥ã€‚</p>
                    
                    <h3>æŠ€æœ¯å®žçŽ°</h3>
                    <p>åœ¨åˆ›ä½œè¿‡ç¨‹ä¸­ï¼Œæˆ‘ç‰¹åˆ«æ³¨é‡å…‰å½±å¤„ç†å’Œæ°›å›´è¥é€ ã€‚é€šè¿‡ç»†è‡´çš„çº¹ç†å’Œç²¾å¿ƒæ¸²æŸ“ï¼Œæˆ‘èµ‹äºˆè¿™ä¸ªåºŸå¼ƒç©ºé—´ç”Ÿå‘½å’Œæ•…äº‹æ„Ÿã€‚è‰²å½©é€‰æ‹©ä¹Ÿç»è¿‡ä»”ç»†è€ƒè™‘ä»¥å¢žå¼ºåœºæ™¯çš„æƒ…æ„Ÿè¡¨è¾¾ã€‚</p>
                `;

            case 'æ£®æž—':
                return `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2025å¹´</span></h3>
                    <p>è¿™æ˜¯ä¸€ä¸ªä¸ªäººçŽ¯å¢ƒæ¦‚å¿µè®¾è®¡é¡¹ç›®ï¼ŒæŽ¢ç´¢ç¥žç§˜æ£®æž—çš„è§†è§‰è¡¨çŽ°å’Œæ°›å›´è¥é€ ã€‚</p>
                    
                    <h3>è®¾è®¡ç†å¿µ</h3>
                    <p>é€šè¿‡è¿™ä¸ªä½œå“ï¼Œæˆ‘æƒ³è¡¨è¾¾è‡ªç„¶çš„ç¥žç§˜å’Œæ´»åŠ›ã€‚èŒ‚å¯†çš„æ¤è¢«ã€ç‹¬ç‰¹çš„å…‰å½±å’Œé›¾çš„å¤„ç†å…±åŒåˆ›é€ å‡ºä¸€ä¸ªæ—¢æ¢¦å¹»åˆçœŸå®žçš„æ£®æž—ä¸–ç•Œï¼Œå¼•å¯¼è§‚ä¼—è¿›å…¥å……æ»¡æƒ³è±¡åŠ›çš„ç©ºé—´ã€‚</p>
                    
                    <h3>æŠ€æœ¯å®žçŽ°</h3>
                    <p>åœ¨åˆ›ä½œè¿‡ç¨‹ä¸­ï¼Œæˆ‘ç‰¹åˆ«æ³¨é‡å…‰çº¿ç©¿é€æ ‘å¶çš„æ•ˆæžœå’Œç©ºé—´å±‚æ¬¡çš„è¡¨è¾¾ã€‚é€šè¿‡ç²¾ç»†çš„ç¬”è§¦å’Œè‰²å½©æ¸å˜ï¼Œæˆ‘åˆ›é€ å‡ºä¸€ä¸ªæ·±é‚ƒè€Œå……æ»¡æ´»åŠ›çš„æ£®æž—æ°›å›´ï¼Œè®©è§‚ä¼—æ„Ÿå—è‡ªç„¶çš„ç¥žç§˜å’Œå®é™ã€‚</p>
                `;

            case 'è§†è§‰å¼€å‘å…¨é›†':
                return `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024å¹´</span></h3>
                    <p>è¿™ä¸ªé¡¹ç›®æ¶‰åŠé€‰æ‹©ä¸€éƒ¨ç”µå½±å¹¶è®¾è®¡ä¸€ç³»åˆ—é“å…·ï¼ŒæŒ‘æˆ˜åœ¨äºŽä¿æŒæ‰€æœ‰è®¾è®¡çš„ç»Ÿä¸€é£Žæ ¼ã€‚</p>
                    
                    <h3>è®¾è®¡ç†å¿µ</h3>
                    <p>è¿™ä¸ªé¡¹ç›®çš„å…³é”®æŒ‘æˆ˜æ˜¯ç¡®ä¿æ‰€æœ‰é“å…·çš„é£Žæ ¼ç»Ÿä¸€ã€‚æ¯ä¸ªç‰©å“éƒ½éœ€è¦çœ‹èµ·æ¥å±žäºŽåŒä¸€ä¸ªä¸–ç•Œè§‚ï¼Œå¹¶ä¸Žæ‰€é€‰ç”µå½±çš„æ•´ä½“ç¾Žå­¦ä¿æŒä¸€è‡´ï¼ŒåŒæ—¶ä¿æŒå…¶ç‹¬ç‰¹çš„ç‰¹å¾å’Œç”¨é€”ã€‚</p>
                    
                    <h3>å·¥ä½œæµç¨‹</h3>
                    <p>è¿™ä¸ªè¿‡ç¨‹æ¶‰åŠåˆ†æžæ‰€é€‰ç”µå½±çš„è§†è§‰é£Žæ ¼ï¼Œåˆ›å»ºæ¦‚å¿µè‰å›¾ï¼Œå¹¶ç¡®ä¿æ¯ä¸ªé“å…·æ—¢ç‹¬ç‰¹åˆä¸Žæ•´ä½“è®¾è®¡åè°ƒã€‚è¿™ä¸ªé¡¹ç›®å±•ç¤ºäº†åœ¨å¤šä¸ªç‰©å“ä¸Šä¿æŒä¸€è‡´è®¾è®¡è¯­è¨€çš„èƒ½åŠ›ï¼ŒåŒæ—¶æœåŠ¡äºŽæ›´å¤§çš„ä¸–ç•Œè§‚æž„å»ºèƒŒæ™¯çš„å™äº‹éœ€æ±‚ã€‚</p>
                `;

            case 'åˆ›æ„é€è§†æµç¨‹':
                return `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024å¹´</span></h3>
                    <p>è¿™ä¸ªé¡¹ç›®è¦æ±‚ä½¿ç”¨äº”ç‚¹é€è§†æ¥åˆ›å»ºä¸€ä¸ªèµ›åšæœ‹å…‹ä¸–ç•Œåœºæ™¯ï¼ŒåŒ…å«ç«è½¦ä¸Šçš„ä¸¤ä¸ªè§’è‰²ã€‚</p>
                    
                    <h3>è®¾è®¡é€‰æ‹©</h3>
                    <p>æˆ‘é€‰æ‹©åˆ›å»ºä¸€ä¸ªèµ›åšæœ‹å…‹åŸŽå¸‚ä¸­æœªæ¥ç«è½¦ä¸Šçš„åŠ¨æ€åœºæ™¯ï¼Œåˆ©ç”¨äº”ç‚¹é€è§†æ¥å¢žå¼ºæˆå‰§æ€§çš„è§†è§‰æ•ˆæžœã€‚è¿™ä¸ªä½œä¸šæŒ‘æˆ˜æˆ‘è¿ç”¨å¤æ‚çš„é€è§†æŠ€æœ¯æ¥åˆ›é€ ä¸€ä¸ªæ²‰æµ¸å¼å’Œè§†è§‰å¼•äººå…¥èƒœçš„çŽ¯å¢ƒã€‚</p>
                    
                    <h3>æŠ€æœ¯è¦ç‚¹</h3>
                    <p>è¿™ä¸ªé¡¹ç›®å±•ç¤ºäº†äº”ç‚¹æ›²çº¿é€è§†çš„åº”ç”¨ï¼Œè¿™å¯¹äºŽåˆ›é€ æˆå‰§æ€§çš„å¹¿è§’è§†å›¾ç‰¹åˆ«æœ‰æ•ˆã€‚é€è§†æŠ€æœ¯æœ‰åŠ©äºŽåˆ›é€ æ²‰æµ¸æ„Ÿå’Œæ·±åº¦æ„Ÿï¼Œè€Œç«è½¦ä¸Šçš„è§’è‰²æ”¾ç½®åˆ™å¢žåŠ äº†å™äº‹è¶£å‘³å’Œåœºæ™¯çš„æ¯”ä¾‹å‚è€ƒã€‚ä»Žåˆå§‹è‰å›¾åˆ°æœ€ç»ˆæ¸²æŸ“çš„è¿‡ç¨‹å±•ç¤ºäº†æˆ‘å¯¹å¤æ‚æ’å›¾æŒ‘æˆ˜çš„ç³»ç»Ÿæ–¹æ³•ã€‚</p>
                `;

            case 'è§’è‰²ç´ æ':
                return `
                    <h3>è§’è‰²ç´ æç ”ç©¶ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024å¹´</span></h3>
                    <p>è¿™ä¸ªé¡¹ç›®å±•ç¤ºäº†è§’è‰²è®¾è®¡å’ŒåŠ¨ä½œ/è¡¨æƒ…ç ”ç©¶çš„ç´ æè¿‡ç¨‹ã€‚é€šè¿‡ç´ æï¼Œæˆ‘æ·±å…¥æŽ¢ç´¢äº†è§’è‰²çš„å¤–è§‚ç‰¹å¾å’ŒåŠ¨æ€å§¿åŠ¿ï¼Œä¸ºåŽç»­çš„è§’è‰²åˆ›ä½œå¥ å®šåŸºç¡€ã€‚</p>
                    
                    <h3>è®¾è®¡è¦ç‚¹</h3>
                    <p>è¿™ä¸ªé¡¹ç›®åŒ…å«ä¸¤ä¸ªä¸»è¦éƒ¨åˆ†ï¼šæ•´ä½“è§’è‰²è®¾è®¡å’Œè¯¦ç»†çš„åŠ¨ä½œ/è¡¨æƒ…ç ”ç©¶ã€‚é€šè¿‡ç²¾ç¡®çš„è§’è‰²æ¯”ä¾‹ã€æœè£…å’Œç‰¹å¾ç´ æï¼Œä»¥åŠå„ç§è¡¨æƒ…å’ŒåŠ¨ä½œå§¿åŠ¿çš„æŽ¢ç´¢ï¼Œå…¨é¢å±•ç¤ºäº†è§’è‰²è®¾è®¡çš„åŸºç¡€å·¥ä½œã€‚</p>
                `;

            case 'PhotoshopåŸºç¡€':
                return `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                    <p>è¿™ä¸ªè¯¾ç¨‹é¡¹ç›®ä¸“æ³¨äºŽæŽŒæ¡æ•°å­—ç»˜ç”»å’Œå›¾åƒç¼–è¾‘æ‰€éœ€çš„åŸºæœ¬PhotoshopæŠ€æœ¯ã€‚</p>
                    
                    <h3>å­¦ä¹ ç›®æ ‡</h3>
                    <p>ä¸»è¦ç›®æ ‡æ˜¯åŸ¹å…»Photoshopæ ¸å¿ƒå·¥å…·å’Œå·¥ä½œæµç¨‹çš„ç†Ÿç»ƒåº¦ï¼ŒåŒ…æ‹¬å›¾å±‚ç®¡ç†ã€è’™ç‰ˆã€è°ƒæ•´å›¾å±‚å’Œæ•°å­—ç»˜ç”»æŠ€æœ¯ã€‚è¿™äº›æŠ€èƒ½ä¸ºæ›´é«˜çº§çš„æ•°å­—è‰ºæœ¯åˆ›ä½œå¥ å®šåŸºç¡€ã€‚</p>
                    
                    <h3>æŠ€æœ¯å®žçŽ°</h3>
                    <p>è¿™ä¸ªé¡¹ç›®æ¶‰åŠè‰²å½©æ ¡æ­£ã€åˆæˆå’Œæ•°å­—ç»˜ç”»æŠ€æœ¯çš„å®žè·µç»ƒä¹ ã€‚ç‰¹åˆ«æ³¨é‡ç†è§£æ”¯æŒä¸“ä¸šçº§æ•°å­—è‰ºæœ¯ç”Ÿäº§çš„æ— æŸå·¥ä½œæµç¨‹å’Œé«˜æ•ˆæ–‡ä»¶ç»„ç»‡æ–¹æ³•ã€‚</p>
                `;

            case 'çŒ«å’ªæ—¥è®°':
                return `
                    <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023å¹´</span></h3>
                    <p>è¿™ä¸ªè§’è‰²è®¾è®¡è¯¾ç¨‹é¡¹ç›®ä¸“æ³¨äºŽåˆ›é€ å…·æœ‰ç‹¬ç‰¹ä¸ªæ€§å’Œå™äº‹æ½œåŠ›çš„å¯çˆ±åŠ¨ç‰©è§’è‰²ã€‚</p>
                    
                    <h3>è®¾è®¡ç†å¿µ</h3>
                    <p>"çŒ«å’ªæ—¥è®°"é¡¹ç›®é€šè¿‡é£Žæ ¼åŒ–çš„è§’è‰²è®¾è®¡æŽ¢ç´¢çŒ«çš„è¿·äººå¤šæ ·æ€§ã€‚æˆ‘æ—¨åœ¨åˆ›é€ å¹³è¡¡æ‹ŸäººåŒ–å“è´¨ä¸ŽçœŸå®žçŒ«ç§‘ç‰¹å¾çš„è§’è‰²ï¼Œäº§ç”Ÿæ—¢ç›¸å…³åˆç‹¬ç‰¹çš„çŒ«ç§‘ä¸ªæ€§ã€‚</p>
                    
                    <h3>æŠ€æœ¯å®žçŽ°</h3>
                    <p>æˆ‘ä¸“æ³¨äºŽå¯Œæœ‰è¡¨çŽ°åŠ›çš„çº¿æ¡å’Œç®€åŒ–çš„å½¢å¼ï¼Œé€šè¿‡å§¿åŠ¿å’Œé¢éƒ¨è¡¨æƒ…ä¼ è¾¾ä¸ªæ€§ã€‚è§’è‰²è®¾è®¡èžå…¥äº†å¸å¼•åŠ›å’Œå¯è¯»æ€§åŽŸåˆ™ï¼Œç¡®ä¿æ¯åªçŒ«éƒ½æœ‰ç‹¬ç‰¹çš„å‰ªå½±å’Œå³æ—¶å¯è¯†åˆ«çš„ç‰¹å¾ã€‚ç®€åŒ–çš„é£Žæ ¼å…è®¸é«˜æ•ˆçš„åŠ¨ç”»æ½œåŠ›ï¼ŒåŒæ—¶ä¿æŒè§’è‰²æ·±åº¦ã€‚</p>
                `;

            default:
                console.log("No Chinese content found for key:", key);
                return null;
        }
    }

    // æ·»åŠ è°ƒè¯•å‡½æ•°ï¼Œä¾¿äºŽæµ‹è¯•
    window.debugModalInfo = function() {
        console.log("å½“å‰æ¨¡æ€æ¡†ä¿¡æ¯:", window.currentModalInfo);
        const lang = localStorage.getItem('preferredLanguage') || 'zh';
        console.log("å½“å‰è¯­è¨€:", lang);
        return {
            modalInfo: window.currentModalInfo,
            language: lang
        };
    };
    
    // å½“é¡µé¢åŠ è½½å®Œæˆæ—¶ï¼Œæ£€æŸ¥è¯­è¨€è®¾ç½®å¹¶åº”ç”¨
    document.addEventListener('DOMContentLoaded', function() {
        console.log("é¡µé¢åŠ è½½å®Œæˆï¼Œåˆå§‹åŒ–ç¿»è¯‘");
        
        // åˆå§‹åŒ–ç¿»è¯‘
        initTranslation();
        
        // æ³¨å†Œä½œå“é¡¹ç›®ç‚¹å‡»äº‹ä»¶
        registerProjectEvents();
        
        // å½“æ¨¡æ€æ¡†æ˜¾ç¤ºæ—¶ï¼Œç¡®ä¿å†…å®¹åŒ¹é…å½“å‰è¯­è¨€
        const projectModal = document.getElementById('projectModal');
        if (projectModal) {
            projectModal.addEventListener('show', function() {
                const lang = localStorage.getItem('preferredLanguage') || 'zh';
                console.log("æ¨¡æ€æ¡†æ˜¾ç¤ºï¼Œå½“å‰è¯­è¨€:", lang);
                
                // å¦‚æžœæœ‰å½“å‰é¡¹ç›®ä¿¡æ¯ï¼Œæ›´æ–°æ¨¡æ€æ¡†å†…å®¹
                if (window.currentModalInfo) {
                    updateModalContentWithLanguage(lang);
                }
            });
        }
    });
    
    // æ·»åŠ å…¨å±€ç¿»è¯‘æ›´æ–°é’©å­
    const originalUpdateAllTranslations = updateAllTranslations;
    updateAllTranslations = function() {
        // è°ƒç”¨åŽŸå§‹ç¿»è¯‘å‡½æ•°
        originalUpdateAllTranslations();
        
        // å¦‚æžœæ¨¡æ€æ¡†æ­£åœ¨æ˜¾ç¤ºï¼Œæ›´æ–°å…¶å†…å®¹
        const projectModal = document.getElementById('projectModal');
        if (projectModal && projectModal.style.display === 'flex' && window.currentModalInfo) {
            const lang = localStorage.getItem('preferredLanguage') || 'zh';
            console.log("å…¨å±€ç¿»è¯‘æ›´æ–°ï¼Œæ›´æ–°æ¨¡æ€æ¡†å†…å®¹ï¼Œè¯­è¨€:", lang);
            updateModalContentWithLanguage(lang);
        }
    };

    // æ·»åŠ ä¸€ä¸ªå…¨å±€æµ‹è¯•å‡½æ•°ï¼Œæ–¹ä¾¿åœ¨æŽ§åˆ¶å°ä¸­è°ƒè¯•å†…å®¹èŽ·å–å’Œæ˜¾ç¤º
    window.testContent = function(key, lang) {
        console.log(`æµ‹è¯•å†…å®¹: key=${key}, language=${lang}`);
        
        // æ ¹æ®è¯­è¨€èŽ·å–å†…å®¹
        let content = null;
        if (lang === 'zh' || lang === 'cn') {
            content = getZhContent(key);
            console.log('ä¸­æ–‡å†…å®¹:', !!content);
        } else {
            content = getEnContent(key);
            if (!content) {
                // å°è¯•ç¿»è¯‘åŽæŸ¥æ‰¾
                const enKey = translateTitleToEn(key);
                content = getEnContent(enKey);
                console.log('å°è¯•ç¿»è¯‘é”®å:', key, '->', enKey, 'ç»“æžœ:', !!content);
            }
            console.log('è‹±æ–‡å†…å®¹:', !!content);
        }
        
        // æ˜¾ç¤ºå†…å®¹
        if (content) {
            console.log('å†…å®¹é¢„è§ˆ:', content.substring(0, 100) + '...');
            return {
                success: true,
                content: content,
                preview: content.substring(0, 100) + '...'
            };
        } else {
            console.log('æœªæ‰¾åˆ°å†…å®¹');
            return {
                success: false,
                message: 'æœªæ‰¾åˆ°å†…å®¹'
            };
        }
    };

    // èŽ·å–é¡¹ç›®å†…å®¹å‡½æ•°
    function getProjectContent(title, lang) {
        console.log(`Getting ${lang} content for project:`, title);
        
        // ç›´æŽ¥ä»Žå†…å®¹æ•°æ®å¯¹è±¡èŽ·å–
        if (contentData[title] && contentData[title][lang]) {
            console.log('Content found in primary lookup');
            return contentData[title][lang];
        }
        
        // å¦‚æžœæ‰¾ä¸åˆ°ï¼Œå¯¹äºŽè‹±æ–‡æ¨¡å¼å°è¯•ä½¿ç”¨æ˜ å°„çš„æ ‡é¢˜æŸ¥æ‰¾
        if (lang === 'en') {
            const enTitle = titleMap[title];
            if (enTitle && contentData[enTitle] && contentData[enTitle][lang]) {
                console.log('Content found using title mapping');
                return contentData[enTitle][lang];
            }
        }
        
        // å¦‚æžœæ‰¾ä¸åˆ°å†…å®¹ï¼Œè¿”å›žnull
        console.log('No content found');
        return null;
    }
});

// å…¨å±€å†…å®¹æ•°æ®ï¼šä¸­è‹±æ–‡é¡¹ç›®æè¿°
const contentData = {
    // ä½¿ç”¨é¡¹ç›®æ ‡é¢˜ä½œä¸ºé”®å
    'è‰ºæœ¯å®¶': {
        zh: `
            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>è¿™æ˜¯ä¸€ä¸ªåŽŸåˆ›è§’è‰²è®¾è®¡é¡¹ç›®ï¼ŒæŽ¢ç´¢ç‹¬ç‰¹çš„è‰ºæœ¯é£Žæ ¼å’Œè§’è‰²è¡¨çŽ°ã€‚</p>
            
            <h3>è®¾è®¡ç†å¿µ</h3>
            <p>è¿™ä¸ªè§’è‰²ä½“çŽ°äº†æˆ‘çš„è‰ºæœ¯é£Žæ ¼ï¼Œå°†ä¼˜é›…ä¸Žè¡¨çŽ°åŠ›ç›¸ç»“åˆã€‚æˆ‘æ—¨åœ¨åˆ›é€ ä¸€ä¸ªå…·æœ‰å¼ºçƒˆä¸ªæ€§å’Œè§†è§‰å†²å‡»åŠ›çš„è§’è‰²ï¼ŒåŒæ—¶ä¿æŒç¥žç§˜æ„Ÿå’Œæ·±åº¦ã€‚</p>
            
            <h3>æŠ€æœ¯å®žçŽ°</h3>
            <p>æˆ‘è¿ç”¨äº†å…ˆè¿›çš„æ•°å­—ç»˜ç”»æŠ€æœ¯ï¼Œæ³¨é‡è‰²å½©å’Œè°ã€å…‰å½±å’Œç»†èŠ‚æ¸²æŸ“ã€‚è§’è‰²è®¾è®¡è¿‡ç¨‹æ¶‰åŠå¹¿æ³›çš„ç ”ç©¶å’Œå¤šæ¬¡è¿­ä»£ï¼Œä»¥è¾¾åˆ°ç¾Žå­¦å’Œè§’è‰²å™äº‹çš„å®Œç¾Žå¹³è¡¡ã€‚</p>
        `,
        en: `
            <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>This is an original character design project that explores unique artistic styles and character representation.</p>
            
            <h3>Design Philosophy</h3>
            <p>This character embodies my artistic style, combining elegance with expressiveness. I aimed to create a character with a strong personality and visual impact, while keeping a sense of mystery and depth.</p>
            
            <h3>Technical Implementation</h3>
            <p>I utilized advanced digital painting techniques, focusing on color harmony, lighting, and detailed rendering. The character design process involved extensive research and multiple iterations to achieve the perfect balance between aesthetics and character storytelling.</p>
        `
    },
    'æœªçŸ¥æ–°çƒ': {
        zh: `
            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>è¿™æ˜¯ä¸€ä¸ªæœªæ¥æ¦‚å¿µåœºæ™¯ï¼ŒæŽ¢ç´¢ç§‘æŠ€ä¸Žè‡ªç„¶çŽ¯å¢ƒçš„äº’åŠ¨ã€‚</p>
            
            <h3>è®¾è®¡ç†å¿µ</h3>
            <p>"æœªçŸ¥æ–°çƒ"æ¦‚å¿µæŽ¢ç´¢äº†è‡ªç„¶çŽ¯å¢ƒä¸­å…ˆè¿›ç§‘æŠ€çš„ç¥žç§˜æ„Ÿã€‚è®¾è®¡æ—¨åœ¨é€šè¿‡æœ‰æœºæ£®æž—çŽ¯å¢ƒä¸Žå‡ ä½•ç§‘æŠ€çƒä½“çš„å¯¹æ¯”ï¼Œåˆ›é€ ä¸€ç§å¥‡å¦™å’Œç§‘å­¦å¥½å¥‡çš„æ„Ÿè§‰ã€‚</p>
            
            <h3>æŠ€æœ¯å®žçŽ°</h3>
            <p>æˆ‘ä¸“æ³¨äºŽåˆ›é€ å…·æœ‰æˆå‰§æ€§é›¾æ•ˆçš„çœŸå®žå…‰ç…§åœºæ™¯ï¼Œä»¥å¢žå¼ºç¥žç§˜æ°›å›´ã€‚æŠ€æœ¯æŒ‘æˆ˜æ¶‰åŠå¹³è¡¡æœ‰æœºæ£®æž—å…ƒç´ ä¸Žçƒä½“çš„ç¡¬è¡¨é¢è®¾è®¡ï¼ŒåŒæ—¶é€šè¿‡è‰²å½©å’Œè°å’Œå¤§æ°”é€è§†ä¿æŒè§†è§‰è¿žè´¯æ€§ã€‚</p>
        `,
        en: `
            <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>This is a futuristic concept scene exploring the interaction between technology and natural environments.</p>
            
            <h3>Design Philosophy</h3>
            <p>The "Unknown Sphere" concept explores the mystery of advanced technology in natural settings. The design aims to create a sense of wonder and scientific curiosity through the contrast between the organic forest environment and the geometric, technological sphere.</p>
            
            <h3>Technical Implementation</h3>
            <p>I focused on creating a realistic lighting scenario with dramatic fog effects to enhance the mysterious atmosphere. The technical challenge involved balancing the organic forest elements with the hard-surface design of the sphere, while maintaining visual coherence through color harmony and atmospheric perspective.</p>
        `
    },
    'æ¨±èŠ±æ‘': {
        zh: `
            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>è¿™æ˜¯ä¸€ä¸ªçŽ¯å¢ƒæ¦‚å¿µè®¾è®¡ï¼Œæç»˜äº†æ¨±èŠ±å­£èŠ‚çš„ä¼ ç»Ÿæ—¥æœ¬æ‘åº„ã€‚</p>
            
            <h3>è®¾è®¡ç†å¿µ</h3>
            <p>"æ¨±èŠ±æ‘"æ¦‚å¿µæŽ¢ç´¢äº†ä¼ ç»Ÿæ—¥æœ¬å»ºç­‘ä¸Žè‡ªç„¶çŽ¯å¢ƒçš„å’Œè°èžåˆã€‚æˆ‘æƒ³æ•æ‰æ¨±èŠ±å­£èŠ‚æ‘åº„çš„å®é™å’Œè¯—æ„æ°›å›´ï¼Œå¼ºè°ƒè¿™ç§å­£èŠ‚æ€§æ—¶åˆ»çš„æ–‡åŒ–æ„ä¹‰å’Œç¾Žå­¦ä»·å€¼ã€‚</p>
            
            <h3>æŠ€æœ¯å®žçŽ°</h3>
            <p>æˆ‘ä»”ç»†æž„å»ºäº†éµå¾ªä¼ ç»Ÿæ—¥æœ¬è®¾è®¡åŽŸåˆ™çš„å»ºç­‘å…ƒç´ ï¼ŒåŒæ—¶ç‰¹åˆ«æ³¨é‡å…‰å½±å’Œå¤§æ°”æ•ˆæžœã€‚æ¨±èŠ±çš„ç²‰è‰²è°ƒä¸Žå»ºç­‘çš„åœŸè‰²è°ƒç›¸å¹³è¡¡ï¼Œåˆ›é€ å‡ºå¢žå¼ºåœºæ™¯æƒ…æ„Ÿå†²å‡»åŠ›çš„å’Œè°è‰²å½©ã€‚</p>
        `,
        en: `
            <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>This environmental concept design depicts a traditional Japanese village during cherry blossom season.</p>
            
            <h3>Design Philosophy</h3>
            <p>The "Sakura Village" concept explores the beauty of traditional Japanese architecture harmoniously integrated with the natural environment. I wanted to capture the tranquil and poetic atmosphere of a village during cherry blossom season, emphasizing the cultural significance and aesthetic value of such seasonal moments.</p>
            
            <h3>Technical Implementation</h3>
            <p>I carefully constructed the architectural elements following traditional Japanese design principles, while giving special attention to the lighting and atmospheric effects. The pink hues of the cherry blossoms were balanced with the earthy tones of the buildings, creating a harmonious color palette that enhances the emotional impact of the scene.</p>
        `
    },
    'ä¸–ç•Œæ ‘': {
        zh: `
            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>è¿™æ˜¯ä¸€ä¸ªæ¦‚å¿µè®¾è®¡ï¼ŒæŽ¢ç´¢ç¥žè¯ä¸­çš„ä¸–ç•Œæ ‘ï¼Œå°†é­”æ³•å…ƒç´ ä¸Žå¥‡å¹»ç¾Žå­¦ç›¸ç»“åˆã€‚</p>
            
            <h3>è®¾è®¡ç†å¿µ</h3>
            <p>"ä¸–ç•Œæ ‘"æ¦‚å¿µçµæ„Ÿæ¥è‡ªå„ç§ç¥žè¯ä¸­è¿žæŽ¥ä¸åŒå­˜åœ¨é¢†åŸŸçš„å®‡å®™æ ‘ã€‚æˆ‘æ—¨åœ¨åˆ›é€ ä¸€ä¸ªæ—¢å¤è€åˆé­”å¹»çš„è®¾è®¡ï¼Œé€šè¿‡å…¶å‘å…‰ç‰¹å¾å’Œå®ä¼Ÿè§„æ¨¡å¼ºè°ƒæ ‘æœ¨ä½œä¸ºä¸–ç•Œæ¡¥æ¢çš„è§’è‰²ã€‚</p>
            
            <h3>æŠ€æœ¯å®žçŽ°</h3>
            <p>æˆ‘è¿ç”¨äº†å…ˆè¿›çš„å…‰ç…§æŠ€æœ¯æ¥åˆ›é€ ä»Žæ ‘æœ¨æ•£å‘å‡ºçš„ç©ºçµå…‰èŠ’ã€‚æž„å›¾ç»è¿‡ç²¾å¿ƒè§„åˆ’ä»¥å¼ºè°ƒæ ‘æœ¨çš„å·¨å¤§è§„æ¨¡ï¼ŒåŒæ—¶æ·»åŠ äº†å¤æ‚çš„ç»†èŠ‚æ¥ä¼ è¾¾å…¶æœ‰æœºå’Œé­”å¹»æ€§è´¨ã€‚è‰²å½©é€‰æ‹©å¢žå¼ºäº†åœºæ™¯çš„ç¥žç§˜æ°›å›´ã€‚</p>
        `,
        en: `
            <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>This concept design explores the mythological World Tree, blending magical elements with fantasy aesthetics.</p>
            
            <h3>Design Philosophy</h3>
            <p>The "World Tree" concept is inspired by various mythologies where a cosmic tree connects different realms of existence. I aimed to create a design that feels both ancient and magical, emphasizing the tree's role as a bridge between worlds through its luminous features and imposing scale.</p>
            
            <h3>Technical Implementation</h3>
            <p>I employed advanced lighting techniques to create the ethereal glow emanating from the tree. The composition was carefully planned to emphasize the massive scale of the tree, while intricate details were added to convey its organic and magical nature. The color palette was chosen to enhance the mystical atmosphere of the scene.</p>
        `
    },
    'å¯ºåº™': {
        zh: `
            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
            <p>è¿™æ˜¯ä¸€ä¸ªå»ºç­‘æ¦‚å¿µè®¾è®¡ï¼ŒæŽ¢ç´¢ä¼ ç»Ÿä¸œæ–¹å¯ºåº™å»ºç­‘çš„å½“ä»£è¯ é‡Šã€‚</p>
            
            <h3>è®¾è®¡ç†å¿µ</h3>
            <p>å¯ºåº™è®¾è®¡çµæ„Ÿæ¥è‡ªä¼ ç»Ÿä¸œæ–¹ç¥žåœ£å»ºç­‘ï¼Œç‰¹åˆ«å€Ÿé‰´äº†ä¸­å›½å’Œæ—¥æœ¬çš„ç¾Žå­¦åŽŸåˆ™ã€‚æˆ‘æƒ³åˆ›é€ ä¸€ä¸ªä¼ è¾¾ç²¾ç¥žå®é™çš„ç©ºé—´ï¼ŒåŒæ—¶èžå…¥å°Šé‡ä¼ ç»Ÿå½¢å¼çš„å¾®å¦™å½“ä»£è®¾è®¡å…ƒç´ ã€‚</p>
            
            <h3>æŠ€æœ¯å®žçŽ°</h3>
            <p>è®¾è®¡è¿‡ç¨‹æ¶‰åŠå¯¹å¯ºåº™å»ºç­‘ä¸­å…¸åž‹çš„å»ºç­‘æ¯”ä¾‹å’Œè£…é¥°å…ƒç´ çš„å¹¿æ³›ç ”ç©¶ã€‚ç‰¹åˆ«æ³¨é‡ç…§æ˜Žè®¾è®¡ï¼Œåˆ©ç”¨è‡ªç„¶å…‰æºæ¥å¢žå¼ºå¯ºåº™çš„ç©ºé—´è´¨é‡å’Œç²¾ç¥žæ°›å›´ã€‚è‰²å½©æ­é…åˆ»æ„ä¿æŒå…‹åˆ¶ï¼Œä»¥å”¤èµ·å®é™å’Œæ²‰æ€ã€‚</p>
        `,
        en: `
            <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
            <p>This architectural concept design explores traditional Eastern temple architecture in a contemporary interpretation.</p>
            
            <h3>Design Philosophy</h3>
            <p>The temple design is inspired by traditional Eastern sacred architecture, particularly drawing from Chinese and Japanese aesthetic principles. I wanted to create a space that conveys spiritual tranquility while incorporating subtle contemporary design elements that respect the traditional forms.</p>
            
            <h3>Technical Implementation</h3>
            <p>The design process involved extensive research on architectural proportions and decorative elements typical in temple construction. Particular attention was paid to the lighting design, using natural light sources to enhance the spatial quality and spiritual atmosphere of the temple. The color palette was deliberately restrained to evoke serenity and contemplation.</p>
        `
    },
    'åºŸå¼ƒå°é•‡': {
        zh: `
            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
            <p>è¿™æ˜¯ä¸€ä¸ªä¸ªäººçŽ¯å¢ƒæ¦‚å¿µè®¾è®¡é¡¹ç›®ï¼ŒæŽ¢ç´¢åºŸå¼ƒåŸŽå¸‚ç©ºé—´ä¸­çš„æ•…äº‹å’Œæƒ…æ„Ÿã€‚</p>
            
            <h3>è®¾è®¡ç†å¿µ</h3>
            <p>é€šè¿‡è¿™ä¸ªä½œå“ï¼Œæˆ‘æƒ³è¡¨è¾¾æ—¶é—´æµé€å’Œäººç±»æ´»åŠ¨ç—•è¿¹çš„ç¾Žå­¦ã€‚åºŸå¼ƒçš„å»ºç­‘å’Œé€æ¸ä¾µèš€çš„è‡ªç„¶å…ƒç´ åˆ›é€ å‡ºç‹¬ç‰¹çš„è§†è§‰å¼ åŠ›ï¼Œä¿ƒä½¿è§‚ä¼—åæ€è¿‡åŽ»å’Œæœªæ¥ã€‚</p>
            
            <h3>æŠ€æœ¯å®žçŽ°</h3>
            <p>åœ¨åˆ›ä½œè¿‡ç¨‹ä¸­ï¼Œæˆ‘ç‰¹åˆ«æ³¨é‡å…‰å½±å¤„ç†å’Œæ°›å›´è¥é€ ã€‚é€šè¿‡ç»†è‡´çš„çº¹ç†å’Œç²¾å¿ƒæ¸²æŸ“ï¼Œæˆ‘èµ‹äºˆè¿™ä¸ªåºŸå¼ƒç©ºé—´ç”Ÿå‘½å’Œæ•…äº‹æ„Ÿã€‚è‰²å½©é€‰æ‹©ä¹Ÿç»è¿‡ä»”ç»†è€ƒè™‘ä»¥å¢žå¼ºåœºæ™¯çš„æƒ…æ„Ÿè¡¨è¾¾ã€‚</p>
        `,
        en: `
            <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
            <p>This is a personal environment concept design project, exploring the stories and emotions contained within abandoned urban spaces.</p>
            
            <h3>Design Philosophy</h3>
            <p>Through this work, I wanted to express the aesthetics of time passing and traces of human activity. The abandoned buildings and gradually encroaching natural elements create a unique visual tension, prompting viewers to reflect on the past and future.</p>
            
            <h3>Technical Implementation</h3>
            <p>During the creation process, I paid special attention to the treatment of light and shadow and the creation of atmosphere. Through detailed textures and careful rendering, I gave this abandoned space life and a sense of story. The choice of color tones was also carefully considered to enhance the emotional expression of the scene.</p>
        `
    },
    'æ£®æž—': {
        zh: `
            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2025</span></h3>
            <p>è¿™æ˜¯ä¸€ä¸ªä¸ªäººçŽ¯å¢ƒæ¦‚å¿µè®¾è®¡é¡¹ç›®ï¼ŒæŽ¢ç´¢ç¥žç§˜æ£®æž—çš„è§†è§‰è¡¨çŽ°å’Œæ°›å›´è¥é€ ã€‚</p>
            
            <h3>è®¾è®¡ç†å¿µ</h3>
            <p>é€šè¿‡è¿™ä¸ªä½œå“ï¼Œæˆ‘æƒ³è¡¨è¾¾è‡ªç„¶çš„ç¥žç§˜å’Œæ´»åŠ›ã€‚èŒ‚å¯†çš„æ¤è¢«ã€ç‹¬ç‰¹çš„å…‰å½±å’Œé›¾çš„å¤„ç†å…±åŒåˆ›é€ å‡ºä¸€ä¸ªæ—¢æ¢¦å¹»åˆçœŸå®žçš„æ£®æž—ä¸–ç•Œï¼Œå¼•å¯¼è§‚ä¼—è¿›å…¥å……æ»¡æƒ³è±¡åŠ›çš„ç©ºé—´ã€‚</p>
            
            <h3>æŠ€æœ¯å®žçŽ°</h3>
            <p>åœ¨åˆ›ä½œè¿‡ç¨‹ä¸­ï¼Œæˆ‘ç‰¹åˆ«æ³¨é‡å…‰çº¿ç©¿é€æ ‘å¶çš„æ•ˆæžœå’Œç©ºé—´å±‚æ¬¡çš„è¡¨è¾¾ã€‚é€šè¿‡ç²¾ç»†çš„ç¬”è§¦å’Œè‰²å½©æ¸å˜ï¼Œæˆ‘åˆ›é€ å‡ºä¸€ä¸ªæ·±é‚ƒè€Œå……æ»¡æ´»åŠ›çš„æ£®æž—æ°›å›´ï¼Œè®©è§‚ä¼—æ„Ÿå—è‡ªç„¶çš„ç¥žç§˜å’Œå®é™ã€‚</p>
        `,
        en: `
            <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2025</span></h3>
            <p>This is a personal environment concept design project, exploring the visual representation and atmosphere creation of a mysterious forest.</p>
            
            <h3>Design Philosophy</h3>
            <p>Through this work, I wanted to express the mystery and vitality of nature. The dense vegetation, unique lighting, and treatment of fog together create a forest world that is both dreamlike and real, guiding viewers into a space full of imagination.</p>
            
            <h3>Technical Implementation</h3>
            <p>During the creation process, I focused particularly on the effect of light penetrating through leaves and the expression of spatial layering. Through fine brushwork and color gradients, I created a deep yet vibrant forest atmosphere, allowing viewers to feel the mystery and tranquility of nature.</p>
        `
    },
    'è§†è§‰å¼€å‘å…¨é›†': {
        zh: `
            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>è¿™ä¸ªé¡¹ç›®æ¶‰åŠé€‰æ‹©ä¸€éƒ¨ç”µå½±å¹¶è®¾è®¡ä¸€ç³»åˆ—é“å…·ï¼ŒæŒ‘æˆ˜åœ¨äºŽä¿æŒæ‰€æœ‰è®¾è®¡çš„ç»Ÿä¸€é£Žæ ¼ã€‚</p>
            
            <h3>è®¾è®¡ç†å¿µ</h3>
            <p>è¿™ä¸ªé¡¹ç›®çš„å…³é”®æŒ‘æˆ˜æ˜¯ç¡®ä¿æ‰€æœ‰é“å…·çš„é£Žæ ¼ç»Ÿä¸€ã€‚æ¯ä¸ªç‰©å“éƒ½éœ€è¦çœ‹èµ·æ¥å±žäºŽåŒä¸€ä¸ªä¸–ç•Œè§‚ï¼Œå¹¶ä¸Žæ‰€é€‰ç”µå½±çš„æ•´ä½“ç¾Žå­¦ä¿æŒä¸€è‡´ï¼ŒåŒæ—¶ä¿æŒå…¶ç‹¬ç‰¹çš„ç‰¹å¾å’Œç”¨é€”ã€‚</p>
            
            <h3>å·¥ä½œæµç¨‹</h3>
            <p>è¿™ä¸ªè¿‡ç¨‹æ¶‰åŠåˆ†æžæ‰€é€‰ç”µå½±çš„è§†è§‰é£Žæ ¼ï¼Œåˆ›å»ºæ¦‚å¿µè‰å›¾ï¼Œå¹¶ç¡®ä¿æ¯ä¸ªé“å…·æ—¢ç‹¬ç‰¹åˆä¸Žæ•´ä½“è®¾è®¡åè°ƒã€‚è¿™ä¸ªé¡¹ç›®å±•ç¤ºäº†åœ¨å¤šä¸ªç‰©å“ä¸Šä¿æŒä¸€è‡´è®¾è®¡è¯­è¨€çš„èƒ½åŠ›ï¼ŒåŒæ—¶æœåŠ¡äºŽæ›´å¤§çš„ä¸–ç•Œè§‚æž„å»ºèƒŒæ™¯çš„å™äº‹éœ€æ±‚ã€‚</p>
        `,
        en: `
            <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>This project involves selecting a movie and designing a series of props, with the challenge of maintaining a unified style across all designs.</p>
            
            <h3>Design Philosophy</h3>
            <p>The key challenge in this project was ensuring stylistic unity across all props. Each item needed to appear as if it belonged to the same world view and aligned with the overall aesthetics of the chosen movie, while still maintaining its unique characteristics and purpose.</p>
            
            <h3>Workflow</h3>
            <p>The process involved analyzing the visual style of the selected movie, creating concept sketches, and ensuring each prop was both unique and cohesive with the overall design. This project demonstrates the ability to maintain consistent design language across multiple items while serving the narrative needs of a larger world-building context.</p>
        `
    },
    'åˆ›æ„é€è§†æµç¨‹': {
        zh: `
            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>è¿™ä¸ªé¡¹ç›®è¦æ±‚ä½¿ç”¨äº”ç‚¹é€è§†æ¥åˆ›å»ºä¸€ä¸ªèµ›åšæœ‹å…‹ä¸–ç•Œåœºæ™¯ï¼ŒåŒ…å«ç«è½¦ä¸Šçš„ä¸¤ä¸ªè§’è‰²ã€‚</p>
            
            <h3>è®¾è®¡é€‰æ‹©</h3>
            <p>æˆ‘é€‰æ‹©åˆ›å»ºä¸€ä¸ªèµ›åšæœ‹å…‹åŸŽå¸‚ä¸­æœªæ¥ç«è½¦ä¸Šçš„åŠ¨æ€åœºæ™¯ï¼Œåˆ©ç”¨äº”ç‚¹é€è§†æ¥å¢žå¼ºæˆå‰§æ€§çš„è§†è§‰æ•ˆæžœã€‚è¿™ä¸ªä½œä¸šæŒ‘æˆ˜æˆ‘è¿ç”¨å¤æ‚çš„é€è§†æŠ€æœ¯æ¥åˆ›é€ ä¸€ä¸ªæ²‰æµ¸å¼å’Œè§†è§‰å¼•äººå…¥èƒœçš„çŽ¯å¢ƒã€‚</p>
            
            <h3>æŠ€æœ¯è¦ç‚¹</h3>
            <p>è¿™ä¸ªé¡¹ç›®å±•ç¤ºäº†äº”ç‚¹æ›²çº¿é€è§†çš„åº”ç”¨ï¼Œè¿™å¯¹äºŽåˆ›é€ æˆå‰§æ€§çš„å¹¿è§’è§†å›¾ç‰¹åˆ«æœ‰æ•ˆã€‚é€è§†æŠ€æœ¯æœ‰åŠ©äºŽåˆ›é€ æ²‰æµ¸æ„Ÿå’Œæ·±åº¦æ„Ÿï¼Œè€Œç«è½¦ä¸Šçš„è§’è‰²æ”¾ç½®åˆ™å¢žåŠ äº†å™äº‹è¶£å‘³å’Œåœºæ™¯çš„æ¯”ä¾‹å‚è€ƒã€‚ä»Žåˆå§‹è‰å›¾åˆ°æœ€ç»ˆæ¸²æŸ“çš„è¿‡ç¨‹å±•ç¤ºäº†æˆ‘å¯¹å¤æ‚æ’å›¾æŒ‘æˆ˜çš„ç³»ç»Ÿæ–¹æ³•ã€‚</p>
        `,
        en: `
            <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>This project required the use of five-point perspective to create a cyberpunk world scene featuring two characters on a train.</p>
            
            <h3>Design Choice</h3>
            <p>I chose to create a dynamic scene of characters on a futuristic train in a cyberpunk city, utilizing five-point perspective to enhance the dramatic visual impact. This assignment challenged me to apply complex perspective techniques to create an immersive and visually compelling environment.</p>
            
            <h3>Technical Points</h3>
            <p>The project showcases the application of five-point curvilinear perspective, which is particularly effective for creating dramatic wide-angle views. The perspective technique helps create a sense of immersion and depth, while the character placement on the train adds narrative interest and scale reference to the scene. The process from initial sketch to final rendering demonstrates my methodical approach to complex illustration challenges.</p>
        `
    },
    'è§’è‰²ç´ æ': {
        zh: `
            <h3>è§’è‰²ç´ æç ”ç©¶ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>è¿™ä¸ªé¡¹ç›®å±•ç¤ºäº†è§’è‰²è®¾è®¡å’ŒåŠ¨ä½œ/è¡¨æƒ…ç ”ç©¶çš„ç´ æè¿‡ç¨‹ã€‚é€šè¿‡ç´ æï¼Œæˆ‘æ·±å…¥æŽ¢ç´¢äº†è§’è‰²çš„å¤–è§‚ç‰¹å¾å’ŒåŠ¨æ€å§¿åŠ¿ï¼Œä¸ºåŽç»­çš„è§’è‰²åˆ›ä½œå¥ å®šåŸºç¡€ã€‚</p>
            
            <h3>è®¾è®¡è¦ç‚¹</h3>
            <p>è¿™ä¸ªé¡¹ç›®åŒ…å«ä¸¤ä¸ªä¸»è¦éƒ¨åˆ†ï¼šæ•´ä½“è§’è‰²è®¾è®¡å’Œè¯¦ç»†çš„åŠ¨ä½œ/è¡¨æƒ…ç ”ç©¶ã€‚é€šè¿‡ç²¾ç¡®çš„è§’è‰²æ¯”ä¾‹ã€æœè£…å’Œç‰¹å¾ç´ æï¼Œä»¥åŠå„ç§è¡¨æƒ…å’ŒåŠ¨ä½œå§¿åŠ¿çš„æŽ¢ç´¢ï¼Œå…¨é¢å±•ç¤ºäº†è§’è‰²è®¾è®¡çš„åŸºç¡€å·¥ä½œã€‚</p>
        `,
        en: `
            <h3>Character Sketch Study <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2024</span></h3>
            <p>This project showcases the sketching process for character design and action/expression studies. Through sketching, I deeply explored the character's appearance features and dynamic postures, laying the foundation for subsequent character creation.</p>
            
            <h3>Design Points</h3>
            <p>The project contains two main parts: overall character design and detailed action/expression studies. Through precise sketching of character proportions, clothing, and features, as well as exploration of various expressions and action postures, it comprehensively demonstrates the fundamental work of character design.</p>
        `
    },
    'PhotoshopåŸºç¡€': {
        zh: `
            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
            <p>è¿™ä¸ªè¯¾ç¨‹é¡¹ç›®ä¸“æ³¨äºŽæŽŒæ¡æ•°å­—ç»˜ç”»å’Œå›¾åƒç¼–è¾‘æ‰€éœ€çš„åŸºæœ¬PhotoshopæŠ€æœ¯ã€‚</p>
            
            <h3>å­¦ä¹ ç›®æ ‡</h3>
            <p>ä¸»è¦ç›®æ ‡æ˜¯åŸ¹å…»Photoshopæ ¸å¿ƒå·¥å…·å’Œå·¥ä½œæµç¨‹çš„ç†Ÿç»ƒåº¦ï¼ŒåŒ…æ‹¬å›¾å±‚ç®¡ç†ã€è’™ç‰ˆã€è°ƒæ•´å›¾å±‚å’Œæ•°å­—ç»˜ç”»æŠ€æœ¯ã€‚è¿™äº›æŠ€èƒ½ä¸ºæ›´é«˜çº§çš„æ•°å­—è‰ºæœ¯åˆ›ä½œå¥ å®šåŸºç¡€ã€‚</p>
            
            <h3>æŠ€æœ¯å®žçŽ°</h3>
            <p>è¿™ä¸ªé¡¹ç›®æ¶‰åŠè‰²å½©æ ¡æ­£ã€åˆæˆå’Œæ•°å­—ç»˜ç”»æŠ€æœ¯çš„å®žè·µç»ƒä¹ ã€‚ç‰¹åˆ«æ³¨é‡ç†è§£æ”¯æŒä¸“ä¸šçº§æ•°å­—è‰ºæœ¯ç”Ÿäº§çš„æ— æŸå·¥ä½œæµç¨‹å’Œé«˜æ•ˆæ–‡ä»¶ç»„ç»‡æ–¹æ³•ã€‚</p>
        `,
        en: `
            <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
            <p>This course project focuses on mastering fundamental Photoshop techniques essential for digital painting and image editing.</p>
            
            <h3>Learning Objectives</h3>
            <p>The main goal was to develop proficiency in Photoshop's core tools and workflows, including layer management, masking, adjustment layers, and digital painting techniques. These skills form the foundation for more advanced digital art creation.</p>
            
            <h3>Technical Implementation</h3>
            <p>The project involved practical exercises in color correction, compositing, and digital painting techniques. Special attention was given to understanding non-destructive workflows and efficient file organization methods that support professional-level digital art production.</p>
        `
    },
    'çŒ«å’ªæ—¥è®°': {
        zh: `
            <h3>é¡¹ç›®èƒŒæ™¯ <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
            <p>è¿™ä¸ªè§’è‰²è®¾è®¡è¯¾ç¨‹é¡¹ç›®ä¸“æ³¨äºŽåˆ›é€ å…·æœ‰ç‹¬ç‰¹ä¸ªæ€§å’Œå™äº‹æ½œåŠ›çš„å¯çˆ±åŠ¨ç‰©è§’è‰²ã€‚</p>
            
            <h3>è®¾è®¡ç†å¿µ</h3>
            <p>"çŒ«å’ªæ—¥è®°"é¡¹ç›®é€šè¿‡é£Žæ ¼åŒ–çš„è§’è‰²è®¾è®¡æŽ¢ç´¢çŒ«çš„è¿·äººå¤šæ ·æ€§ã€‚æˆ‘æ—¨åœ¨åˆ›é€ å¹³è¡¡æ‹ŸäººåŒ–å“è´¨ä¸ŽçœŸå®žçŒ«ç§‘ç‰¹å¾çš„è§’è‰²ï¼Œäº§ç”Ÿæ—¢ç›¸å…³åˆç‹¬ç‰¹çš„çŒ«ç§‘ä¸ªæ€§ã€‚</p>
            
            <h3>æŠ€æœ¯å®žçŽ°</h3>
            <p>æˆ‘ä¸“æ³¨äºŽå¯Œæœ‰è¡¨çŽ°åŠ›çš„çº¿æ¡å’Œç®€åŒ–çš„å½¢å¼ï¼Œé€šè¿‡å§¿åŠ¿å’Œé¢éƒ¨è¡¨æƒ…ä¼ è¾¾ä¸ªæ€§ã€‚è§’è‰²è®¾è®¡èžå…¥äº†å¸å¼•åŠ›å’Œå¯è¯»æ€§åŽŸåˆ™ï¼Œç¡®ä¿æ¯åªçŒ«éƒ½æœ‰ç‹¬ç‰¹çš„å‰ªå½±å’Œå³æ—¶å¯è¯†åˆ«çš„ç‰¹å¾ã€‚ç®€åŒ–çš„é£Žæ ¼å…è®¸é«˜æ•ˆçš„åŠ¨ç”»æ½œåŠ›ï¼ŒåŒæ—¶ä¿æŒè§’è‰²æ·±åº¦ã€‚</p>
        `,
        en: `
            <h3>Project Background <span style="font-size: 0.9rem; font-weight: normal; color: #888;">2023</span></h3>
            <p>This character design course project focuses on creating appealing animal characters with distinctive personalities and narrative potential.</p>
            
            <h3>Design Philosophy</h3>
            <p>The "Cat Diary" project explores the charming and diverse personalities of cats through stylized character design. I aimed to create characters that balance anthropomorphic qualities with authentic feline characteristics, resulting in relatable yet distinctly cat-like personalities.</p>
            
            <h3>Technical Implementation</h3>
            <p>I focused on expressive line work and simplified forms to convey personality through posture and facial expressions. The character designs incorporate principles of appeal and readability, ensuring each cat has a distinct silhouette and instantly recognizable traits. The simplified style allows for efficient animation potential while maintaining character depth.</p>
        `
    }
};

// è‹±æ–‡æ ‡é¢˜æ˜ å°„
const titleMap = {
    'è‰ºæœ¯å®¶': 'Artist',
    'æœªçŸ¥æ–°çƒ': 'Unknown Sphere',
    'æ¨±èŠ±æ‘': 'Sakura Village',
    'ä¸–ç•Œæ ‘': 'World Tree',
    'å¯ºåº™': 'Temple',
    'æ£®æž—': 'Mysterious Forest',
    'è§†è§‰å¼€å‘å…¨é›†': 'Visual Development Collection',
    'åˆ›æ„é€è§†æµç¨‹': 'Creative Perspective Process',
    'è§’è‰²ç´ æ': 'Character Sketches',
    'PhotoshopåŸºç¡€': 'Photoshop Fundamentals',
    'çŒ«å’ªæ—¥è®°': 'Cat Diary'
};

