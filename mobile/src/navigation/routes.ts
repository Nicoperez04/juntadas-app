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
    Timer: 'Timer',
    TeamRandomizer: 'TeamRandomizer',
    ImpostorStart: 'ImpostorStart',
    ImpostorRole: 'ImpostorRole',
    WhoAmISetup: 'WhoAmISetup',
    WhoAmIGame: 'WhoAmIGame',
    GroupQuestions: 'GroupQuestions',
    MemoriesGallery: 'MemoriesGallery',
    MemoryViewer: 'MemoryViewer',
    MeetupHistory: 'MeetupHistory',
    ReviewForm: 'ReviewForm',
    CompleteProfile: 'CompleteProfile',
    Profile: 'Profile',
  } as const;
  
  export type RouteNames = typeof Routes[keyof typeof Routes];