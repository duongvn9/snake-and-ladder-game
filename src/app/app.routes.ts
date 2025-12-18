import {Routes} from '@angular/router';
import {PlayerSetupComponent} from './components/player-setup/player-setup.component';
import {GameMainComponent} from './components/game-main/game-main.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/setup',
        pathMatch: 'full'
    }, 
    {
        path: 'setup',
        component: PlayerSetupComponent
    },
    {
        path: 'game',
        component: GameMainComponent
    }
];
