<template>
    <ion-page>
        <div id="canvas_area"></div>
    </ion-page>
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'Home',
    components: {
        IonPage,
    }
});
</script>

<style scoped>
</style>
