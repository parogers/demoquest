<template>
    <ion-page>
        <div id="canvas_area"></div>
    </ion-page>
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { defineComponent } from 'vue';
import * as PIXI from 'pixi.js';

export default defineComponent({
    name: 'Home',
    components: {
        IonPage,
    },
    mounted: () => {
        const app = new PIXI.Application({ width: 640, height: 360 });
        const div = document.getElementById('canvas_area');
        if (div) {
            div.appendChild(app.view);
        }
    },
});
</script>

<style scoped>
#canvas_area
{
    width: 800px;
    height: 800px;
}

canvas
{
    margin: 0;
    padding: 0;
    margin-left: auto;
    margin-right: auto;
    display: block;
}
</style>
