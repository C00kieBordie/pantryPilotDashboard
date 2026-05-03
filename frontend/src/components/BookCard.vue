<script setup lang="ts">
    import {computed} from 'vue';
    const props = defineProps<{
        'imgSrc': string,
        'title': string,
        'author': string,
        'quantity': number,
        'status': string,
    }>();
    const coverUrl = computed(() => {
        if (!props.imgSrc)
            return 'https://placehold.co/400x600?text=No+Cover';
        else
            return `https://covers.openlibrary.org/b/id/${props.imgSrc}-L.jpg`;
    });
</script>
<template>
    <div class="bg-[#C7BC96] rounded-lg p-1">
        <q-card class="w-64 bg-[#E1D9BC] shadow-md hover:shadow-xl transition-shadow">
            <q-img :src="coverUrl" height="200px" />

            <q-card-section>
                <div class="text-h6 text-[#30364F] font-bold truncate">{{ title }}</div>
                <div class="text-subtitle2 text-grey-7">By {{ author }}</div>
            </q-card-section>
        </q-card>
    </div>
</template>

