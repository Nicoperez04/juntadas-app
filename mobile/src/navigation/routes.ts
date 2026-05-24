export const Routes = {
    // Auth
    Welcome: 'Welcome',
    Login: 'Login',
    Register: 'Register',
    ForgotPassword: 'ForgotPassword',
  
    // Main
    MeetupHome: 'MeetupHome',
    CreateMeetup: 'CreateMeetup',
    JoinMeetup: 'JoinMeetup',
    MeetupDetail: 'MeetupDetail',
    EditMeetup: 'EditMeetup',
    ParticipantList: 'ParticipantList',
    Games: 'Games',
    ImpostorStart: 'ImpostorStart',
    ImpostorRole: 'ImpostorRole',
    MemoriesGallery: 'MemoriesGallery',
    MeetupHistory: 'MeetupHistory',
    CompleteProfile: 'CompleteProfile',
    Profile: 'Profile',
  } as const;
  
  export type RouteNames = typeof Routes[keyof typeof Routes];