<?php
defined('ABSPATH') || exit;

/** Explicit role PLUS project membership checks for each office tool. */
final class Mojarrad_Office_Access {
    public static function role(int $uid): string {
        $user=get_userdata($uid);
        return $user?Mojarrad_Access::role_for($user):'visitor';
    }
    public static function permitted(int $uid,int $pid,string $section,string $operation='read'): bool {
        $role=self::role($uid);
        if($role==='visitor')return false;
        if($section==='contacts')return $pid===0 && in_array($role,array('admin','executor'),true);
        if($section==='archive')return $pid>0 && $role==='admin' && Mojarrad_Access::can_read($uid,$pid);
        if($pid<=0 || !Mojarrad_Access::can_read($uid,$pid))return false;
        $read=array(
            'references'=>array('admin','executor','engineer','foreman','owner','supervisor','contractor'),
            'documents'=>array('admin','executor','engineer','foreman','owner','supervisor'),
            'payments'=>array('admin','executor','owner'),
            'contracts'=>array('admin','executor'),
            'workers'=>array('admin','executor','engineer','foreman'),
        );
        $write=array(
            'references'=>array('admin','executor','owner'),
            'documents'=>array('admin','executor','engineer','foreman'),
            'payments'=>array('admin','executor','owner'),
            'contracts'=>array('admin','executor'),
            'workers'=>array('admin','executor','engineer','foreman'),
        );
        if($operation==='message'){
            return $section==='references' && $role!=='supervisor' && in_array($role,$read['references'],true);
        }
        $roles=$operation==='read'?$read:$write;
        return isset($roles[$section]) && in_array($role,$roles[$section],true);
    }
    public static function delete(int $uid,int $pid,string $section): bool {
        if(!self::permitted($uid,$pid,$section,'write'))return false;
        $role=self::role($uid);
        return in_array($role,array('admin','executor'),true);
    }
    public static function capabilities(int $uid,int $pid): array {
        $out=array();
        foreach(array('references','documents','payments','contracts','workers') as $section) {
            if(self::permitted($uid,$pid,$section,'read')) $out[$section]=array(
                'write'=>self::permitted($uid,$pid,$section,'write'),
                'delete'=>self::delete($uid,$pid,$section),
                'comment'=>self::permitted($uid,$pid,$section,'message'),
            );
        }
        if(self::permitted($uid,0,'contacts'))$out['contacts']=array('write'=>true,'delete'=>true);
        if(self::permitted($uid,$pid,'archive'))$out['archive']=array('write'=>true,'delete'=>false);
        return $out;
    }
}
