(function () {
    'use strict';

    BX.namespace('IA.PROJECTS');

    BX.IA = {
        PROJECTS2: {
            init_projects: function (arItems) {
                _projects_init(arItems);
            },
        },
    };


    let duration = 1.5;

    //Подготовка объекта гранима
    function creatGranimObj(element, states) {
        const granimInstance = new Granim({
            element: element,
            name: 'interactive-gradient',
            elToSetClassOn: '.slider-wrapper',
            direction: 'top-bottom',
            isPausedWhenNotInView: true,
            stateTransitionSpeed: duration * 1000,
            states: states,
        });
        return granimInstance;
    };

    //Подготовка состояний гранима
    function creatGranimStates(dataGranim) {
        let granimIdx = [];
        const statesGranim = {};

        Object.entries(dataGranim).forEach((state, idx, array) => {

            if (idx + 1 == 1) {
                statesGranim["default-state"] = creatGranimState(state[1]['GRADIENT_TOP'], state[1]['GRADIENT_CENTER'], state[1]['GRADIENT_BOTTOM']);
                statesGranim[state[0]] = creatGranimState(state[1]['GRADIENT_TOP'], state[1]['GRADIENT_CENTER'], state[1]['GRADIENT_BOTTOM']);
            } else {
                statesGranim[state[0]] = creatGranimState(state[1]['GRADIENT_TOP'], state[1]['GRADIENT_CENTER'], state[1]['GRADIENT_BOTTOM']);
            }
            granimIdx.push(state[0]);
        });

        return {
            statesGranim: statesGranim,
            granimIdx: granimIdx
        };
    };

    //Подготовка одного состояния гранима
    function creatGranimState(colorTop, colorCenter, colorBottom) {
        const granimState = {
            gradients: [
                [
                    {color: colorTop ? colorTop : '#FFFFFF', pos: 0},
                    {color: colorCenter ? colorCenter : '#FFFFFF', pos: .5},
                    {color: colorBottom ? colorBottom : '#FFFFFF', pos: 1}
                ]
            ],
            loop: false
        };
        return granimState;
    };


    function initLenis() {
        const lenis = new Lenis({
            // autoRaf: true,
            // touch: true,
            // //scrub: true, // плавная прокрутка
            // smooth: true, // сглаживание
            // smoothWheel: true,
            // syncTouch: false,
            // overscroll: false,
            // orientation: 'vertical',

            duration,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
            direction: 'vertical',
            smoothTouch: true,
            touchMultiplier: 2,
        });
        return lenis;
    };

    function recolorFilterIcon(sliderItem, index) {
        const targetElement = sliderItem.filter(`[data-index="${String(index)}"]`);
        if (!!targetElement) {
            $('.filters-icon-path').css('fill', targetElement.data('filtersColor'));
        }
        return null;
    };

    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    function calculatedHeaderHeight() {
        const header = document.getElementById('header');
        if (header) {
            return header.getBoundingClientRect().height;
        }
        return 0;
    }

    function checkIsMobileDevice() {
        // Проверяем User Agent
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // Регулярные выражения для мобильных устройств
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

        // Проверка User Agent
        if (mobileRegex.test(userAgent)) {
            return true;
        }

        // Дополнительные проверки
        return (
            // Проверка ширины экрана (опционально)
            window.innerWidth <= 768 ||

            // Проверка touch событий
            ('ontouchstart' in window) ||

            // Проверка максимального количества touch точек
            (navigator.maxTouchPoints > 0) ||

            // Проверка для MS Pointer events
            (navigator.msMaxTouchPoints > 0)
        );
    }


    const isMobileDevice = checkIsMobileDevice();

    // alert(isMobileDevice);

    function calculateAddressBarHeight() {
        if (isMobileDevice) {
            const visualViewport = window.visualViewport;

            if (visualViewport) {
                // Для браузеров, поддерживающих Visual Viewport API
                // alert(window.screen.height - visualViewport.height)
                return window.screen.height - visualViewport.height;
            }

            // Fallback для старых браузеров
            return window.outerHeight - window.innerHeight;
        }
        return 0;
    }

    // сборка объектов слайдера и гранима + фильтрация с пересборкой объектов + общий скролл над документом
    function _projects_init(arItems) {
        $(document).ready(function () {
            let headerHeight = calculatedHeaderHeight();

            const sliderWrapper = $(".slider-wrapper"),
                sliderWrapperObj = document.querySelector(".slider-wrapper"),
                slider = $("#projects"),
                sliderObj = document.querySelector("#projects"),
                filters = $('.filters-wrapper'),
                slideInfoDesc = $(".slide-info-desc"),
                slideInfoTitle = $(".slide-info-title"),
                slideInfoSubtitle = $(".slide-info-subtitle"),
                slideChipsList = $(".chips-list"),
                slideInfoBtn = $(".slide-info-btn"),
                photosObj = document.querySelector("#photos"),
                dotters = $("#dotters"),

                buttonFltr = document.querySelector('.ssfilter'),
                buttonFltrTextDefault = 'Выберите компетенции',
                buttonFltrTextShow = 'Показать ',
                buttonFltrTextEmpty = 'Нет такого проекта';

            let btnClicked = false,
                scrollStartY = window.pageYOffset,
                isSliderUpListen = false,
                isSliderDownListen = false,
                scrollSliderUp = false,
                dottersList = $(".dot-visible");

            // let factorSlideHeight = window.innerWidth < 1050 ? 1.2 : 1.7;

            let {
                sliderWrapperTop,
                slideHeight,
                sliderItem,
                sliderWrapperHeight,
                arrPointShowSlides,
                menuPointPositions
            } = getSliderHeight();

            const lenis = initLenis();

            function raf(timestamp) {
                lenis.raf(timestamp);
                requestAnimationFrame(raf);
            }

            requestAnimationFrame(raf);

            // получение размеров для проектов
            function getSliderHeight() {
                const sliderWrapperTop = sliderWrapper.offset().top,
                    sliderTop = slider.offset().top,
                    sliderHeight = sliderObj.getBoundingClientRect().height,
                    sliderBottom = sliderTop + sliderHeight,
                    slideHeight = document.querySelector('.slide-visible').offsetHeight,
                    sliderItem = $(".slide-visible");

                //console.log('sliderWrapperTop', sliderWrapperTop, 'sliderTop', sliderTop, 'sliderHeight', sliderHeight, 'sliderBottom', sliderBottom, 'slideHeight', slideHeight, 'sliderItem', sliderItem );

                const sliderWrapperHeight = slideHeight * sliderItem.length;
                sliderWrapperObj.style.height = sliderWrapperHeight + 'px';
                const sliderWrapperBottom = sliderWrapperTop + sliderWrapperHeight;
                const stepShowSlide = ((sliderWrapperHeight * 0.9 - slideHeight - headerHeight) / (sliderItem.length - 1)) / sliderWrapperHeight;
                const arrPointShowSlides = {0: -0.2,}
                Array.from(sliderItem).forEach((item, index) => {
                    const key = index + 1;
                    arrPointShowSlides[key] = ((index + 1) * stepShowSlide) - 0.05;
                });
                arrPointShowSlides[sliderItem.length] = 0.95;

                // подготовка объекта с положениями блоков страницы для меню
                const menuPointPositions = {};
                const menuPoints = document.querySelectorAll('.menu-scroll');
                Array.from(menuPoints).forEach(point => {
                    const result = point.dataset.target;
                    const top = (result === 'feedback') ?
                        sliderWrapperTop + sliderWrapperHeight + photosObj.getBoundingClientRect().height - headerHeight * 2 :
                        $('#' + result).offset().top - 3 * headerHeight;
                    const bottom = (result === 'slider-wrapper') ?
                        top + sliderWrapperHeight + 2 * headerHeight :
                        result === 'feedback' ?
                            document.body.scrollHeight + sliderWrapperHeight :
                            top + $('#' + result).height() - 2 * headerHeight;

                    menuPointPositions[result] = {
                        top: top,
                        bottom: bottom
                    };
                });

                return {
                    sliderWrapperTop: sliderWrapperTop,
                    sliderTop: sliderTop,
                    sliderHeight: sliderHeight,
                    sliderBottom: sliderBottom,
                    slideHeight: slideHeight,
                    sliderItem: sliderItem,
                    sliderWrapperHeight: sliderWrapperHeight,
                    sliderWrapperBottom: sliderWrapperBottom,
                    stepShowSlide: stepShowSlide,
                    arrPointShowSlides: arrPointShowSlides,
                    menuPointPositions: menuPointPositions
                };
            }

            // подготовка первоначальных данных для гранима
            const dataGranim = {};
            arItems.forEach(item => {
                dataGranim[item['ID']] = {
                    'GRADIENT_TOP': item['PROPERTY_GRADIENT_TOP_VALUE'],
                    'GRADIENT_CENTER': item['PROPERTY_GRADIENT_CENTER_VALUE'],
                    'GRADIENT_BOTTOM': item['PROPERTY_GRADIENT_BOTTOM_VALUE'],
                    'ID': item['ID'],
                };
            });

            // первоначальная инициация гранима
            let {statesGranim, granimIdx} = creatGranimStates(dataGranim);
            let granimInstance = creatGranimObj('#gradient_bg', statesGranim);

            // Подготовка фильтра
            BX.bindDelegate(BX('form_filter'), 'change', {}, function (e) {
                if (!e) {
                    e = window.event;
                }
                const formData = $('#form_filter').serializeArray();
                if (formData.length == 1) {
                    const slidesFilter = document.querySelectorAll('.slider-item');
                    dotters.html('');

                    let countSlides = 0;
                    slidesFilter.forEach((slide, index) => {
                        slide.classList.remove('slide-opacity');
                        slide.classList.remove('slide-current');
                        slide.classList.add('slide-visible');
                        slide.dataset.index = countSlides;
                        const clsNewDot = (countSlides === 0) ? 'dot dot-visible active' : 'dot dot-visible';
                        const newDot = $('<span>', {
                            class: clsNewDot,
                        });
                        newDot.attr('data-index', countSlides);
                        dotters.append(newDot);
                        countSlides = countSlides + 1;
                    });
                    dottersList = $('.dot-visible');
                    dotters.attr('data-before', 1);
                    // переинициация гранима

                    ({statesGranim, granimIdx} = creatGranimStates(dataGranim));
                    granimInstance.destroy();
                    granimInstance = creatGranimObj('#gradient_bg', statesGranim);
                    const {
                        sliderWrapperTop,
                        slideHeight,
                        sliderItem,
                        sliderWrapperHeight,
                        arrPointShowSlides,
                        menuPointPositions
                    } = getSliderHeight();
                    granimInstance.changeState(["default-state"]);
                    recolorFilterIcon(sliderItem, 0);
                    sliderItem.eq(0).addClass('slide-current');
                    sliderAnim(0);
                    lenis.scrollTo(sliderWrapperTop, {
                        offset: -headerHeight,
                        duration
                    });
                    // lenis.off('scroll', debouncedHandleScroll);
                    // lenis.on('scroll', debouncedHandleScroll);

                    buttonFltr.innerHTML = '';
                    buttonFltr.append(buttonFltrTextDefault);
                    buttonFltr.disabled = true;
                } else {
                    BX.ajax.runComponentAction("itaces:projects", "setfilter", {
                        mode: "class",
                        data: {
                            "arParams": formData
                        }
                    }).then(function (response) {
                        console.log(response);
                        const count = response['data']['result']['count'];
                        buttonFltr.disabled = false;
                        if (count == undefined) {
                            buttonFltr.innerHTML = '';
                            buttonFltr.append(buttonFltrTextDefault);
                            buttonFltr.disabled = true;
                        } else if (count == 0) {
                            buttonFltr.innerHTML = '';
                            buttonFltr.disabled = true;
                            buttonFltr.append(buttonFltrTextEmpty);
                        } else {
                            const span = document.createElement('span');
                            span.textContent = response['data']['result']['count'];
                            buttonFltr.innerHTML = '';
                            buttonFltr.append(buttonFltrTextShow);
                            buttonFltr.append(span);
                        }

                    }, function (response) {
                        let str_error = '';
                        response["errors"].forEach(error => {
                            str_error += `${error['message']} <br>`;
                        });
                        console.error(str_error);
                    });
                }

                return BX.PreventDefault(e);


            });

            // фильтрация
            BX.bindDelegate(BX('form_filter'), 'click', {className: 'ssfilter'}, function (e) {
                if (!e) {
                    e = window.event;
                }
                const formData = $('#form_filter').serializeArray();
                $('.filters-wrapper').removeClass('opened');
                BX.ajax.runComponentAction("itaces:projects", "setfilter", {
                    mode: "class",
                    data: {
                        "arParams": formData
                    }
                }).then(function (response) {
                    const itemsResponse = response['data']['result']['items'];
                    buttonFltr.innerHTML = '';
                    buttonFltr.append(buttonFltrTextDefault);

                    const slidesFilter = document.querySelectorAll('.slider-item');
                    dotters.html('');

                    // подготовка слайдов к фильтрации
                    let countSlides = 0;
                    slidesFilter.forEach((slide, index) => {
                        slide.classList.remove('slide-opacity');
                        slide.classList.remove('slide-current');
                        if (Object.keys(itemsResponse).includes(slide.dataset.id)) {
                            slide.classList.add('slide-visible');
                            slide.dataset.index = countSlides;
                            const clsNewDot = (countSlides === 0) ? 'dot dot-visible active' : 'dot dot-visible';
                            const newDot = $('<span>', {
                                class: clsNewDot,
                            });
                            newDot.attr('data-index', countSlides);
                            dotters.append(newDot);
                            countSlides = countSlides + 1;
                        } else {
                            slide.classList.remove('slide-visible');
                            slide.dataset.index = '';
                        }
                    });
                    dottersList = $('.dot-visible');
                    dotters.attr('data-before', 1);
                    // переинициация гранима
                    const {
                        statesGranim: statesGranimFilter,
                        granimIdx: granimIdxFilter
                    } = creatGranimStates(itemsResponse);
                    granimInstance.destroy();
                    granimInstance = creatGranimObj('#gradient_bg', statesGranimFilter);
                    const {
                        sliderWrapperTop,
                        slideHeight,
                        sliderItem,
                        sliderWrapperHeight,
                        arrPointShowSlides,
                        menuPointPositions
                    } = getSliderHeight();
                    granimIdx = granimIdxFilter;
                    granimInstance.changeState(["default-state"]);
                    recolorFilterIcon(sliderItem, 0);
                    sliderItem.eq(0).addClass('slide-current');

                    let firstIndex = -1;
                    slidesFilter.forEach((slide, idx) => {
                        if (firstIndex === -1 && slide.classList.contains('slide-visible')) {
                            firstIndex = idx;
                        }
                    })

                    if (firstIndex === -1) {
                        firstIndex = 0;
                    }

                    // snapToSlide(0);
                    // slideScrollDown(targetSlide);
                    // slideScrollAnimation(firstIndex);
                    currentSlide = 0;
                    sliderAnim(firstIndex)
                    // lenis.scrollTo(sliderWrapperTop, {
                    //     offset: -headerHeight,
                    //     duration
                    // });
                    // lenis.off('scroll', debouncedHandleScroll);
                    // lenis.on('scroll', debouncedHandleScroll);

                }, function (response) {
                    let str_error = '';
                    response["errors"].forEach(error => {
                        str_error += `${error['message']} <br>`;
                    });
                    console.error(str_error);
                });
                return BX.PreventDefault(e);

            });

            // первоначальное состояние, если очнулись не вверху страницы
            // очистка хеша и переход
            if (window.location.hash) {
                const hash = window.location.hash;
                history.replaceState(null, '', window.location.pathname + window.location.search);
                if (!!hash) {
                    if (hash == '#slider-wrapper') {
                        isSliderUpListen = true;
                        isSliderDownListen = false;
                        granimInstance.changeState(["default-state"]);
                        recolorFilterIcon(sliderItem, 0);
                        sliderItem.eq(0).addClass('slide-current');
                        sliderAnim(0);
                        dottersList.removeClass('active');
                        dottersList.eq(0).addClass('active');
                    }
                    if (hash == '#feedback') {
                        isSliderUpListen = false;
                        isSliderDownListen = true;
                        granimInstance.changeState(granimIdx[sliderItem.length - 1]);
                        recolorFilterIcon(sliderItem, sliderItem.length - 1);
                        dottersList.removeClass('active');
                        dottersList.eq(sliderItem.length - 1).addClass('active');
                        sliderItem.addClass('slide-current');
                        sliderItem.addClass('slide-opacity');
                        sliderItem.eq(sliderItem.length - 1).removeClass('slide-opacity');
                        for (let i = 0; i <= sliderItem.length - 1; i++) {
                            sliderAnim(i);
                        }
                    }

                    setTimeout(() => {
                        const delta = hash === "#slider-wrapper" ?
                            headerHeight :
                            hash === "#feedback" ?
                                -4 * headerHeight :
                                headerHeight + 80;
                        const target = hash === "#feedback" ?
                            Object.entries(menuPointPositions).find(([key, value]) => key === 'feedback')[1].top :
                            hash;
                        lenis.scrollTo(target, {
                            offset: -delta,
                            duration,
                            smooth: true,
                            easing: (t) => t * (2 - t),
                        });
                    }, 1000)

                }
            } else {
                lenis.scrollTo(0, {
                    duration
                });
            }


            // Обновления переменных при изменении размера окна
            const debouncedHandleResize = debounce(handleResize, 50);
            $(window).on('resize', handleResize);

            function handleResize() {
                if (window.innerWidth > 1050) {
                    ({
                        sliderWrapperTop,
                        slideHeight,
                        sliderItem,
                        sliderWrapperHeight,
                        arrPointShowSlides,
                        menuPointPositions
                    } = getSliderHeight(1.7));
                }
                headerHeight = calculatedHeaderHeight();

                // const currentViewportHeight = window.innerHeight;
                // const windowHeight = window.outerHeight;
                // headerHeight = //(-1) *
                //     (windowHeight - currentViewportHeight);
            }

            // наблюдение за окном (подумать, надо ли debounce, но вроде надо)
            // const debouncedHandleScroll = debounce(handleScroll, 10);
            // const throttledHandleScroll = throttle(handleScroll, 50);
            lenis.on('scroll', handleScroll);
            const sliderEl = $(".slider-wrapper");


            let currentSlide = 0;
            let sliding = false;
            let isScrolling = false;
            let scrollDirection = 0;
            let lastScroll = 0;
            let threshold = slideHeight * 0.5;
            let isInSlider = false;
            let lastIsInSlider = false;
            let isBottomOfSlider = false;

            function snapToSlide(targetSlide, scrollToBottom) {
                const filteredSlides = sliderItem.filter('.slide-visible');
                let additionalMobileOffset = 0;
                if (isMobileDevice && scrollToBottom && targetSlide !== 0) {
                    additionalMobileOffset = calculateAddressBarHeight();
                }
                let slidePositions = Array(filteredSlides.length).fill(0).map((_, idx) => {
                    return Math.floor(window.scrollY + sliderWrapperObj.getBoundingClientRect().top - headerHeight - additionalMobileOffset + (sliderEl.height() / filteredSlides.length) * idx);
                })
                // console.log(slidePositions, filteredSlides);
                isScrolling = true;
                currentSlide = targetSlide;
                lenis.scrollTo(slidePositions[targetSlide], {
                    duration: 0,
                    easing: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
                    lock: true,
                    onComplete: () => {
                        isScrolling = false;
                        lastScroll = slidePositions[targetSlide];
                    }
                })
            }

            function slideScrollAnimation(slideIndex) {
                // console.log(sliderItem, granimIdx, dottersList, slideIndex);

                const currentSlide = sliderItem.filter('.slide-visible')[slideIndex];
                const currentRealIndex = sliderItem.index(currentSlide);

                sliderItem.each(function (idx, slide) {
                    slide.classList.remove('slide-opacity');
                    slide.classList.remove('slide-current');
                    if (idx <= currentRealIndex) {
                        slide.classList.add('slide-current');
                    }
                    if (idx < currentRealIndex) {
                        slide.classList.add('slide-opacity');
                    }
                })

                granimInstance.changeState(granimIdx[slideIndex]);
                dotters.attr('data-before', slideIndex + 1);
                dottersList.removeClass('active');
                dottersList.eq(slideIndex).addClass('active');
                recolorFilterIcon(sliderItem, slideIndex);
                sliderAnim(slideIndex);
            }

            // TODO
            // скроллинг всего окна
            function handleScroll({scroll: computedScroll, velocity}) {
                //наблюдение за позицией
                // const scrollTopPosition = window.pageYOffset || document.documentElement.scrollTop;
                // const direction = (scrollTopPosition > scrollStartY && Math.abs(scrollTopPosition - scrollStartY) > 2) ? 'down' : (scrollTopPosition < scrollStartY && Math.abs(scrollTopPosition - scrollStartY) > 2) ? 'up' : 'undefined';
                // scrollStartY = scrollTopPosition;
                if (isScrolling) return;

                const filteredSlides = sliderItem.filter('.slide-visible');

                const scroll = Math.floor(computedScroll);

                scrollDirection = scroll > lastScroll ? 1 : -1;

                lastScroll = scroll;

                let sliderBottomPosition = scroll + sliderWrapperObj.getBoundingClientRect().bottom;
                let sliderTopPosition = scroll + sliderWrapperObj.getBoundingClientRect().top;

                isInSlider = scroll >= sliderTopPosition - threshold && scroll <= sliderBottomPosition - threshold * 1.5;

                if (isInSlider) {
                    if (!filters.hasClass('filters-current')) {
                        filters.addClass('filters-current');
                    }
                } else {
                    if (filters.hasClass('filters-current')) {
                        filters.removeClass('filters-current');
                    }
                }
                // console.log('isInSlider', isInSlider, 'lastIsInSlider', lastIsInSlider);
                if (!lastIsInSlider && isInSlider) {
                    let calculatedSlide;
                    if (isBottomOfSlider) {
                        isBottomOfSlider = false;
                        calculatedSlide = 0;
                    } else if (scrollDirection > 0) {
                        calculatedSlide = 0;
                    } else {
                        calculatedSlide = filteredSlides.length - 1;
                    }
                    // todo есть проблема с анимациями при включенных фильтрах
                    snapToSlide(calculatedSlide, scrollDirection > 0);
                    // slideScrollDown(calculatedSlide);
                    slideScrollAnimation(calculatedSlide);
                    // updateActiveSlide();
                }
                lastIsInSlider = isInSlider;
                // console.log('isScrolling', isScrolling);
                if (isScrolling) return;
                if (isInSlider) {
                    let targetSlide = currentSlide

                    // console.log('targetSlide', targetSlide, 'currentSlide', currentSlide, 'scrollDirection', scrollDirection, 'currentPosition', currentPosition, 'slidePositions[currentSlide])',
                    //     slidePositions[currentSlide], 'isBottomOfSlider', isBottomOfSlider)
                    // console.log(scrollDirection, currentSlide)
                    // const calculatedThreshold = currentSlide === 0 || currentSlide === slides.length - 1 ? threshold : 0;
                    if (scrollDirection > 0 && currentSlide < filteredSlides.length) {
                        targetSlide = currentSlide + 1;
                    } else if (scrollDirection < 0 && currentSlide > 0) {
                        targetSlide = currentSlide - 1;
                    }
                    if (targetSlide < 0) {
                        targetSlide = 0;
                    } else if (targetSlide >= filteredSlides.length) {
                        targetSlide = filteredSlides.length - 1;
                    }
                    if (targetSlide !== currentSlide) {
                        // let localTargetSlide = targetSlide;
                        // let localCurrentSlide = currentSlide;
                        snapToSlide(targetSlide, scrollDirection > 0);
                        // slideScrollDown(targetSlide);
                        slideScrollAnimation(targetSlide);
                        // if (localTargetSlide > localCurrentSlide) {
                        //
                        // } else {
                        //     slideScrollUp(targetSlide)
                        // }
                    }
                    // console.log('targetSlide', targetSlide);
                    // updateActiveSlide()
                } else {
                    // slides.forEach((slide, index) => {
                    //     slide.classList.remove('active')
                    // })
                    if (scroll > sliderBottomPosition - threshold * 1.5) {
                        isBottomOfSlider = true;
                    }
                }

                // // переключение пунктов меню
                // Object.entries(menuPointPositions).forEach(([key, point]) => {
                //     if ((scrollTopPosition > point.top) && (scrollTopPosition < point.bottom)) {
                //         $(`.menu-scroll[data-target="${key}"]`).addClass('active');
                //         $(`.menu-mobile-scroll[data-target="${key}"]`).addClass('active');
                //     } else {
                //         $(`.menu-scroll[data-target="${key}"]`).removeClass('active');
                //         $(`.menu-mobile-scroll[data-target="${key}"]`).removeClass('active');
                //     }
                //     ;
                // });

                // процент открутки в слайдере, подсчет
                // const percentScrollSlider = -(sliderWrapperObj.getBoundingClientRect().top - headerHeight) / (sliderWrapperHeight - slideHeight - headerHeight);
                //console.log('percentScrollSlider', percentScrollSlider, 'sliderWrapperObj.getBoundingClientRect().top', sliderWrapperObj.getBoundingClientRect().top);

                // обработка прохождения точек слайдера вниз
                // if (direction === 'down' && percentScrollSlider > -0.3 && percentScrollSlider < 1) {
                //console.log('sliding down', sliding);
                // sliderItem.each((index, item) => {
                //     if (!item.classList.contains('slide-current') && percentScrollSlider > arrPointShowSlides[index] && percentScrollSlider < arrPointShowSlides[index + 1]) {
                //         slideScrollDown(index);
                //     }
                // });
                // if (!filters.hasClass('filters-current')) {
                //     filters.addClass('filters-current');
                // }
                // }

                // if (isSliderDownListen && percentScrollSlider > 1.1) {
                //     scrollSliderUp = true;
                // }
                // обработка прохождения точек слайдера наверх, если мы  НЕ пролистали его вниз
                // и здесь же отлистывание последнего слайда вверх после доскролла к началу
                // if (direction === 'up' && percentScrollSlider > -0.5 && percentScrollSlider < 1 && !scrollSliderUp) {
                //     sliderItem.each((index, item) => {
                //         // if (percentScrollSlider > arrPointShowSlides[index - 1] && percentScrollSlider < arrPointShowSlides[index] && !item.classList.contains('slide-opacity')) {
                //         //     slideScrollUp(index);
                //         // }
                //         // отлистывание последнего слайда вверх после доскролла к началу
                //         if (percentScrollSlider < -0.1 && !item.classList.contains('slide-opacity')) {
                //             if (index == 0) {
                //                 item.classList.remove('slide-current');
                //                 if (filters.hasClass('filters-current')) {
                //                     filters.removeClass('filters-current');
                //                 }
                //                 isSliderUpListen = true;
                //                 isSliderDownListen = false;
                //                 scrollSliderUp = false;
                //             }
                //         }
                //     })
                // }
                // открутка слайдера наверх к первому кадру, если мы  уже пролистали его вниз
                // if (direction === 'up' && percentScrollSlider < 1.01 && percentScrollSlider > 0 && scrollSliderUp) {
                //     // sliderAllScrollUp();
                // }
            }

            // переход на один слайд вниз
            function slideScrollDown(slideIndex) {
                //console.log('sliding scroll', sliding);
                sliding = true;
                // lenis.stop();
                granimInstance.changeState(granimIdx[slideIndex]);
                dotters.attr('data-before', slideIndex + 1);
                dottersList.removeClass('active');
                dottersList.eq(slideIndex).addClass('active');
                recolorFilterIcon(sliderItem, slideIndex);
                sliderAnim(slideIndex);
                sliderItem[slideIndex].classList.add('slide-current');
                if (slideIndex > 0) {
                    const currentSlide = sliderItem[slideIndex - 1];
                    currentSlide.classList.add('slide-opacity');
                }
                if (slideIndex === sliderItem.length - 1) {
                    isSliderUpListen = false;
                    isSliderDownListen = true;
                } else {
                    isSliderDownListen = false;
                }
                //setTimeout(() => {
                //	console.log('sliding timeout', sliding);
                //	sliding = false;
                //    lenis.start();
                //}, 2000);
            }

            // переход на один слайд вверх
            function slideScrollUp(slideIndex) {
                if (slideIndex > 0) {
                    dotters.attr('data-before', slideIndex);
                    dottersList.removeClass('active');
                    dottersList.eq(slideIndex - 1).addClass('active');
                    granimInstance.changeState(granimIdx[slideIndex - 1]);
                    recolorFilterIcon(sliderItem, slideIndex - 1);
                    const prevSlide = sliderItem[slideIndex - 1];
                    prevSlide.classList.remove('slide-opacity');
                } else {
                    if (filters.hasClass('filters-current')) {
                        filters.removeClass('filters-current');
                    }
                    isSliderUpListen = true;
                }
                sliderItem[slideIndex].classList.remove('slide-current');
                isSliderDownListen = false;
            }

            // быстрое отлистывание слайдера вверх
            function sliderAllScrollUp() {
                const currentSlides = $(".slide-current");
                dotters.attr('data-before', 1);
                dottersList.removeClass('active');
                dottersList.eq(0).addClass('active');
                lenis.scrollTo(sliderWrapperTop + headerHeight, {
                    duration,
                    smooth: true,
                    easing: (t) => t * (2 - t),
                    lock: true,
                });
                isSliderUpListen = true;
                isSliderDownListen = false;
                scrollSliderUp = false;
            }

            // анимация внутри слайдера
            function sliderAnim(slideIndex) {
                const newActiveSlide = $(sliderItem[slideIndex]),
                    animationName = "fadeInLeftBig",
                    visibleClass = "visible",
                    title = newActiveSlide.find(slideInfoTitle),
                    subtitle = newActiveSlide.find(slideInfoSubtitle),
                    desc = newActiveSlide.find(slideInfoDesc),
                    chipsList = newActiveSlide.find(slideChipsList),
                    infoBtn = newActiveSlide.find(slideInfoBtn);

                title.addClass(animationName + " " + visibleClass);
                subtitle.addClass(animationName + " " + visibleClass);
                desc.addClass(animationName + " " + visibleClass);
                chipsList.addClass(animationName + " " + visibleClass);
                infoBtn.addClass(animationName + " " + visibleClass);

                setTimeout(function () {
                    title.removeClass(animationName);
                    subtitle.removeClass(animationName);
                    desc.removeClass(animationName);
                    chipsList.removeClass(animationName);
                    infoBtn.removeClass(animationName);
                }, duration)
            };

            // скролл из меню хедера
            $(".menu-animate-btn").on('click', function (event) {
                event.preventDefault();
                if (window.location.hash) {
                    history.replaceState(null, '', window.location.pathname + window.location.search);
                }
                $("#menuMobile").removeClass("open");
                const start = $('.menu-animate-btn.active:first').attr("href");
                const target = $(this).attr("href");
                if (!!start && start === target) {
                    return false;
                }
                btnClicked = true;
                sliderItem.removeClass('slide-opacity');
                sliderItem.removeClass('slide-current');
                if (target === "#slider-wrapper") {
                    setTimeout(() => {
                        slideScrollDown(0);
                        if (!filters.hasClass('filters-current')) {
                            filters.addClass('filters-current');
                        }
                    }, 600);
                } else if (target === "#feedback") {
                    sliderItem.each((index, item) => {
                        slideScrollDown(index);
                    });
                    if (!filters.hasClass('filters-current')) {
                        filters.addClass('filters-current');
                    }
                }
                const delta = target === "#slider-wrapper" ? headerHeight : headerHeight + 80;
                lenis.scrollTo($(target).offset().top - delta, {
                    duration,
                    lock: true,
                });
                btnClicked = false;
                return btnClicked;
            });


            const filtersOpenBtn = $(".filters-open-btn"),
                filtersWrapper = $(".filters-wrapper");

            function closeFiltersOutside(e) {
                if (!$(e.target).is('.filters-wrapper, .filters-wrapper *')) {
                    filtersWrapper.removeClass("opened")
                    $(document).off('click', closeFiltersOutside)
                }
            };

            filtersOpenBtn.on("click", function () {
                if (filtersWrapper.hasClass("opened")) {
                    filtersWrapper.removeClass("opened");
                    $(document).off('click', closeFiltersOutside)
                } else {
                    filtersWrapper.addClass("opened");
                    setTimeout(function () {
                        $(document).on('click', closeFiltersOutside)
                    }, 200)
                }
            });


        });
    };


    let supportsPassive = false;
    try {
        window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
            get: function () {
                supportsPassive = true;
            }
        }));
    } catch (e) {
    }
})();
