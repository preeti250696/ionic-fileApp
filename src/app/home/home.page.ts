import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { AlertController, Platform, ToastController } from '@ionic/angular';
import { File, Entry } from '@ionic-native/file/ngx';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  copyFile = null;
  shouldMove = false;
  folder = '';
  directories = [];
  constructor(private file: File, private plt: Platform, private alt: AlertController, private fileOpener: FileOpener, private router: Router,
    private route: ActivatedRoute, private toastCtrl: ToastController) { }

  ngOnInit() {
    this.folder = this.route.snapshot.paramMap.get('folder') || '';
    console.log('folder', this.folder);
    this.loadDocument();
  }
  loadDocument() {
    this.plt.ready().then(() => {
      this.copyFile = null;
      this.shouldMove = false;
      console.log(this.file.dataDirectory);
      this.file.listDir(this.file.dataDirectory, this.folder).then(res => {
        this.directories = res;
        console.log(this.directories);
      })
    });
  }

  async createFolder() {
    let alert = await this.alt.create({
      header: 'Create Folder',
      message: 'Please specify the name of the folder',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'MyDir'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Create',
          handler: data => {
            this.file
              .createDir(
                `${this.file.dataDirectory}/${this.folder}`,
                data.name,
                false
              )
              .then(res => {
                this.loadDocument();
              })
          }
        }
      ]
    })
    await alert.present();
  }

  async createFile() {
    let alert = await this.alt.create({
      header: 'Create File',
      message: 'Please specify the name of file',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'MyFile'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Create',
          handler: data => {
            console.log(data);
            this.file
              .writeFile(
                `${this.file.dataDirectory}/${this.folder}`,
                `${data.name}.txt`,
                `My custom text - ${new Date().getTime()}`
              )
              .then(res => {
                this.loadDocument();
              })
          }
        }
      ]
    });
    await alert.present();
  }
 async itemClicked(file: Entry) {
    if (this.copyFile) {
      if(!file.isDirectory){
        let toast = await this.toastCtrl.create({
          message: 'Please select a folder for this operation'
       });
       await toast.present();
       return;
      }
       this.finishCopyFile(file);
    } else {
      if (file.isFile) {
        this.fileOpener.open(file.nativeURL, 'text/plain');
      } else {
        let pathToOpen = this.folder != '' ? this.folder + '/' + file.name : file.name;
        let folder = encodeURIComponent(pathToOpen);
        console.log('move to', folder);
        this.router.navigateByUrl(`/home/${folder}`)
      }
    }

  }
  deleteFile(file: Entry) {
    let path = this.file.dataDirectory + this.folder;
    this.file.removeFile(path, file.name).then(() => {
      this.loadDocument();
    });
    this.file.removeDir(path, file.name).then(()=>{
      this.loadDocument();
    })
  }
  startCopy(file: Entry, moveFile = false) {
    this.copyFile = file;
    this.shouldMove = moveFile;
  }
  finishCopyFile(file: Entry){
   let path = this.file.dataDirectory + this.folder;
   let newPath = this.file.dataDirectory + this.folder + '/' + file.name;
   console.log('From:', path);
   console.log('To:', newPath);
   if(this.shouldMove){
     if(this.copyFile.isDirectory){
       this.file.moveDir(path, this.copyFile.name, newPath, this.copyFile.name)
       .then(()=>{
         this.loadDocument();
       })
     } else{
       this.file.moveFile(path, this.copyFile.name, newPath, this.copyFile.name)
       .then(() =>{
         this.loadDocument();
       })
     }
   } else{
     if(this.copyFile.isDirectory){
       this.file.copyDir(path, this.copyFile.name, newPath, this.copyFile.name)
       .then(()=>{
         this.loadDocument();
       })
     } else{
       this.file.copyFile(path, this.copyFile.name, newPath, this.copyFile.name)
       .then(()=>{
         this.loadDocument();
       })
     }
   }
  }
}
