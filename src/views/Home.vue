<template>
    <ion-page>
        <div id="canvas_area"></div>
    </ion-page>
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { defineComponent } from 'vue';
import { configure } from '../game/main';

export default defineComponent({
    name: 'Home',
    components: {
        IonPage,
    },
    mounted() {
        const div = document.getElementById('canvas_area');
        if (div) {
            configure(div);
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
