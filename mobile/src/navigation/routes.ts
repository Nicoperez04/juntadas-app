export const Routes = {
    // Auth
    Welcome: 'Welcome',
    Login: 'Login',
    Register: 'Register',
    ForgotPassword: 'ForgotPassword',
    ResetPassword: 'ResetPassword',
  
    // Main
    MeetupHome: 'MeetupHome',
    CreateMeetup: 'CreateMeetup',
    JoinMeetup: 'JoinMeetup',
    MeetupDetail: 'MeetupDetail',
    MeetupStats: 'MeetupStats',
    MeetupResultsHistory: 'MeetupResultsHistory',
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
    ScorerSetup: 'ScorerSetup',
    ScorerGame: 'ScorerGame',
    TrucoSetup: 'TrucoSetup',
    TrucoGame: 'TrucoGame',
    GeneralaSetup: 'GeneralaSetup',
    GeneralaGame: 'GeneralaGame',
    Raffle: 'Raffle',
    LeagueSetup: 'LeagueSetup',
    LeagueGame: 'LeagueGame',
    TournamentSetup: 'TournamentSetup',
    TournamentGame: 'TournamentGame',
    MemoriesGallery: 'MemoriesGallery',
    MemoryViewer: 'MemoryViewer',
    MeetupHistory: 'MeetupHistory',
    ReviewForm: 'ReviewForm',
    CompleteProfile: 'CompleteProfile',
    Profile: 'Profile',
    ChangePassword: 'ChangePassword',

    // Bloque 4.2 (grupos)
    ChooseJoinType: 'ChooseJoinType',
    GroupHome: 'GroupHome',
    CreateGroup: 'CreateGroup',
    JoinGroup: 'JoinGroup',

    // Bloque 4.3 (grupos: detalle y miembros)
    GroupDetail: 'GroupDetail',
    GroupMembers: 'GroupMembers',

    // Bloque 4.4b (grupos: listado de juntadas del grupo)
    GroupMeetups: 'GroupMeetups',
  } as const;
  
  export type RouteNames = typeof Routes[keyof typeof Routes];
