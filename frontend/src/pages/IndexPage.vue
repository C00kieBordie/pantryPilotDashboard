<script setup lang="ts">
  import {ref, onMounted} from 'vue';
  import BookCard from 'components/BookCard.vue';

  interface Book {
    ID: string;
    imgSrc: string;
    title: string;
    author: string;
    status: string;
    qty: number;
  }
  const slide = ref('style');
  const myBooks = ref<Book[]>([]);

  const fetchBooks = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/getBooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if(data.ok){
        myBooks.value = data.books.result;
      }else{
        alert('Failed to fetch books.')
      }
    }catch (error) {
      console.error("Database connection failed", error);
    }
  }
  onMounted(async () => {
    await fetchBooks();
  });
</script>

<template>
  <q-page class="column items-center justify-start pt-10 q-gutter-y-lg">
    <div class="q-pa-md">
      <div class="q-gutter-md">
        <q-carousel
            v-model="slide" transition-prev="scale" transition-next="scale"
            swipeable animated control-color="white" navigation
            padding arrows height="300px" class="bg-primary text-white shadow-1 rounded-borders">
          <q-carousel-slide name="style" class="column no-wrap flex-center">
            <q-icon name="style" size="56px" />
            <div class="q-mt-md text-center">
                {{  }}
              </div></q-carousel-slide>
            <q-carousel-slide name="tv" class="column no-wrap flex-center">
              <q-icon name="live_tv" size="56px" />
                <div class="q-mt-md text-center">hello
                </div>
            </q-carousel-slide>
            <q-carousel-slide name="layers" class="column no-wrap flex-center">
              <q-icon name="layers" size="56px" />
                <div class="q-mt-md text-center">
                  {{  }}
                </div>
              </q-carousel-slide>
            <q-carousel-slide name="map" class="column no-wrap flex-center">
              <q-icon name="terrain" size="56px" />
              <div class="q-mt-md text-center">
                {{  }}
              </div>
          </q-carousel-slide>
        </q-carousel>
      </div>
    </div>

    
    <div class="
      bg-[#E1D9BC]
      flex
      flex-row
      gap-5
      rounded-2xl
      p-2
      justify-center"
    >
      <BookCard
        v-for="book in myBooks"
          :key="book.ID"
          :imgSrc="book.imgSrc"
          :title="book.title"
          :author="book.author"
          :quantity="Number(book.qty)"
          :status="book.status"
      />
    </div>
  </q-page>
</template>
