declare module "swiper/vue" {
    import component from "*.vue";
    import _Vue from "vue";

    export class Swiper extends component {}

    export class SwiperSlide extends component {}
}
