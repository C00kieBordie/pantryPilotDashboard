<script setup lang="ts">
  import {ref, onMounted} from 'vue';
  import type { QTableProps } from 'quasar';

  interface BookRow {
    ID: number;
    title: string;
    author: string;
    authorID?: number; 
    status: string;
    qty: number;
    imgSrc?: string;
  }
  interface AuthorRow {
    ID: number;
    authorName: string;
  }

  const bookName = ref('');
  const authName = ref('');
  const inputAuthID = ref();
  const status = ref('');
  const quantity = ref(0);
  const bookID = ref();

  const bookRows = ref([]);
  const authRows = ref([]);
  const loading = ref(false);
  const fetched = ref(false);
  const tabName = ref('books');
function onBooksRowClick(evt: Event, row: BookRow) {
  bookID.value = row.ID;
  bookName.value = row.title;
  authName.value = row.author;
  
  inputAuthID.value = row.authorID || row.ID; 
  
  status.value = row.status;
  quantity.value = row.qty;
  fetched.value = true;
}
async function onAuthorRowClick(evt: Event, row: AuthorRow) {
    loading.value = true;
    try{
      const response = await fetch('http://localhost:3000/api/searchBookByID', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            authorID: row.ID,
        })
      });
      const data = await response.json();
      if(data.ok){
        bookRows.value = data.books.result;
        tabName.value = 'books';
        alert(data.message);
      }else{
        alert('Author has no books.')
      }
    }catch(error){
      console.error("Database connection failed", error);
    }finally{
      loading.value = false;
    }
}
const options = [
        'avaialable', 'out of stock', 'in progress'
      ];

  const bookCol: QTableProps['columns'] = [
    { name: 'book_ID', label: 'ID', field: 'ID', align: 'left' },
    { name: 'book_name', label: 'Book Name', field: 'title', align: 'left' },
    { name: 'author', label: 'Author', field: 'author', align: 'left' },
    { name: 'status', label: 'Status', field: 'status', align: 'left' },
    { name: 'qty', label: 'Quantity', field: 'qty', align: 'left' },
  ];
  const authCol: QTableProps['columns'] = [
    { name: 'auth_ID', label: 'Author ID', field: 'ID', align: 'left'},
    { name: 'author', label: 'Author Name', field: 'authorName', align: 'left'},
  ];

  async function getIdentifier(){
    try {
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(bookName.value)}&author=${encodeURIComponent(authName.value)}`
    );
    const data = await response.json();

    const firstBook = data.docs.find((doc: { cover_i: number }) => doc.cover_i);

    return firstBook ? firstBook.cover_i : null;
  } catch (error) {
    console.error("Error fetching cover:", error);
    return 'https://via.placeholder.com/150?text=Error';
  }
  }

  async function fillBooksTable(){
    loading.value = true;
    try {
        const response = await fetch('http://localhost:3000/api/getBooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        if(data.ok){
          bookRows.value = data.books.result;
          console.log(data);
        }else{
          alert('Failed to fetch books.')
        }
      }
    catch (error) {
      console.error("Database connection failed", error);
    }finally{
      loading.value = false;
    }
  }
  async function fillAuthorsTable(){
    loading.value = true;
    try {
        const response = await fetch('http://localhost:3000/api/getAuthors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        if(data.ok){
          authRows.value = data.books.result;
          console.log(data);
        }else{
          alert('Failed to fetch books.')
        }
      }
    catch (error) {
      console.error("Database connection failed", error);
    }finally{
      loading.value = false;
    }
  }
  async function addBook(){
    if(inputAuthID.value < 1 || bookName.value === '' || status.value === '' || quantity.value < 0){
      return;
    }
    try {
      const identifier = await getIdentifier();
      const response = await fetch('http://localhost:3000/api/addBook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
                    author: inputAuthID.value, 
                    title: bookName.value,
                    bookIdentifier: identifier,
                    status: status.value,
                    qty: quantity.value,
        }),
      });

      const data = await response.json();
      if(data.ok){
        console.log(data.message);
        await fillBooksTable();
      }else{
        alert(data.message);
      }
    }
    catch (error) {
      console.error("Database connection failed", error);
    }
  }
  async function addAuth(){
    if(authName.value === ''){
      alert('Empty field');
      return;
    }
    try{
      const response = await fetch('http://localhost:3000/api/addAuthor', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            authorName: authName.value,
        })
      });
      const data = await response.json();
      if(data.ok){
        alert(data.message);
      }
    }catch(error){
      console.error("Database connection failed", error);
    }
  }
  async function searchBook(){
    loading.value = true;

    try{
      const response = await fetch('http://localhost:3000/api/searchBook', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            bookName: bookName.value,
        })
      });
      const data = await response.json();
      if(data.ok){
        bookRows.value = data.books.result;
        console.log(data);
      }else{
        alert('Failed to fetch books.')
      }
    }catch(error){
      console.error("Database connection failed", error);
    }finally{
      loading.value = false;
    }
  }
  async function deleteBook(){
    try{
      const response = await fetch('http://localhost:3000/api/deleteBook', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            bookID: bookName.value,
        })
      });
      const data = await response.json();
      if(data.ok){
        console.log('Book Successfuly deleted!');
        await fillBooksTable();
      }else{
        alert('Failed to fetch books.')
      }
    }catch(error){
      console.error("Database connection failed", error);
    }
  }
  async function editBook(){
    if(!fetched.value){
      alert('Please fetch Books first...')
      return;
    }
    try{
      const response = await fetch('http://localhost:3000/api/editBook', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
                    bookID: bookID.value,
                    title: bookName.value,
                    authorID: inputAuthID.value,
                    status: status.value,
                    qty: quantity.value,
        })
      });
      const data = await response.json();
      if(data.ok){
        alert(data.message);
      }
    }catch(err){
      console.error("Database connection failed", err);
    }finally{
      fetched.value = false;
      await fillBooksTable();
  }
  }
  
  onMounted(async () => {
      await fillBooksTable();
      await fillAuthorsTable();
  });
</script>

<template>
  <q-page class="h-screen overflow-hidden flex flex-col p-4">
    
    <div class="row q-col-gutter-md grow no-wrap">
      
      <div class="col-5 flex flex-col">
        <q-card class="full-width grow p-6 flex flex-col shadow-lg">
          <div class="text-h6 mb-4">Book Details</div>
          
          <div class="space-y-4">
            <q-input v-model="bookName" label="Book Name" stack-label outlined />
            <q-input v-model="authName" label="Author Name" stack-label outlined />
            <q-input v-model.number="inputAuthID" label="Author ID" stack-label outlined />
            
            <q-select 
              rounded 
              outlined 
              v-model="status" 
              :options="options" 
              label="Inventory Status" 
            />
            
            <q-input v-model.number="quantity" label="Quantity" stack-label outlined />
          </div>
          <q-btn color="primary" icon="person_add" label="Add author" @click="addAuth" class="mt-4 q-col-gutter-md" />
          <q-btn color="primary" icon="view_list" label="Show all Books" @click="fillBooksTable" class="mt-4 q-col-gutter-md" />

          <div class="grid grid-cols-2 gap-4 mt-6">
            <q-btn color="primary" icon="search" label="Search for Book" @click="searchBook"/>
            <q-btn color="primary" icon="save" label="Add Book" @click="addBook" />
            <q-btn color="primary" icon="delete" label="Delete Book" @click="deleteBook"/>
            <q-btn color="primary" icon="edit" label="Edit Book" @click="editBook"/>
          </div>
          
        </q-card>
      </div>

      <div class="col-7 flex flex-col">
        <q-card class="full-width grow p-2 shadow-lg bg-grey-1">
          <q-tabs>
            <q-tab name="books" @click="tabName = 'books'" label="Books"/>
            <q-tab name="authors" @click="tabName = 'authors'" label="Authors"/>
          </q-tabs>
          <q-separator />

          <q-tab-panels v-model="tabName" animated class="bg-transparent">
            <q-tab-panel name="books">
              <div class="q-pa-md">
                  <q-table
                    class="my-sticky-header-table"
                    flat bordered
                    title="Library Records"
                    :rows="bookRows"
                    :columns="bookCol"
                    :loading="loading"
                    row-key="id" 
                    @row-click="onBooksRowClick"
                  />
              </div>
            </q-tab-panel>
              <q-tab-panel name="authors" class="q-gutter-y-md q-pa-lg">
                <div class="q-pa-md">
                  <q-table
                    class="my-sticky-header-table"
                    flat bordered
                    title="Library Records"
                    :rows="authRows"
                    :columns="authCol"
                    :loading="loading"
                    row-key="id" 
                    @row-click="onAuthorRowClick"
                  />
                </div>
              </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

