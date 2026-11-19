
drop database if exists oracle;
create database oracle;
use oracle;

create table location(
    location_id int primary key,
    city varchar(25),
    state varchar(25),
    postal_code varchar(25),
    country varchar(25)
);

create table charity_foundation(
    foundation_id int primary key,
    foundation_name varchar(100) unique key,
    description text,
    cause_area varchar(50),
    service_area varchar(50),
    contact_email varchar(254),
    website_url varchar(255),
    status varchar(25)
);

create table `user`(
    user_id int primary key,
    location_id int,
    name varchar(50),
    email varchar(254) unique key,
    password_hash varchar(255),
    role enum('user','charity_rep','admin') default 'user',
    foundation_id int,
    phone varchar(25),
    bio varchar(255),
    created_at datetime default current_timestamp,
    foreign key (location_id) references location(location_id),
    foreign key (foundation_id) references charity_foundation(foundation_id)
);

create table category(
    category_id int primary key,
    category_name varchar(25) unique key
);

create table clothing_item(
    item_id int primary key,
    owner_id int,
    category_id int,
    location_id int,
    title varchar(50),
    size varchar(25),
    `condition` varchar(25),
    status varchar(25),
    listed_at datetime default current_timestamp,
    description varchar(500),
    brand varchar(80),
    material varchar(100),
    color varchar(60),
    weight_kg decimal(6,2),
    is_featured boolean default false,
    foreign key (owner_id) references `user`(user_id),
    foreign key (category_id) references category(category_id),
    foreign key (location_id) references location(location_id)
);

create table user_preference(
    preference_id int primary key,
    user_id int,
    category_id int,
    preferred_size varchar(25),
    foreign key (category_id) references category(category_id),
    foreign key (user_id) references `user`(user_id)
);

create table wishlist(
    wishlist_id int primary key,
    user_id int,
    wishlist_name varchar(25),
    foreign key (user_id) references `user`(user_id)
);

create table wishlist_item(
    wishlist_id int,
    item_id int,
    added_at datetime default current_timestamp,
    primary key (wishlist_id, item_id),
    foreign key (wishlist_id) references wishlist(wishlist_id),
    foreign key (item_id) references clothing_item(item_id)
);

create table thrift_listing(
    thrift_listing_id int primary key,
    item_id int unique,
    price decimal(10,2),
    status varchar(25),
    listed_at datetime default current_timestamp,
    swap_preferences varchar(500),
    campus_hub varchar(100),
    foreign key (item_id) references clothing_item(item_id)
);

create table thrift_order(
    order_id int primary key,
    thrift_listing_id int unique,
    buyer_id int,
    sale_price decimal(10,2),
    order_status varchar(25),
    ordered_at datetime default current_timestamp,
    pickup_location_id int,
    meeting_note varchar(255),
    payment_method varchar(25) default 'campus_card',
    foreign key (thrift_listing_id) references thrift_listing(thrift_listing_id),
    foreign key (buyer_id) references `user`(user_id),
    foreign key (pickup_location_id) references location(location_id) on delete set null
);

create table exchange_request(
    request_id int primary key,
    requester_id int,
    requested_item_id int,
    offered_item_id int,
    status varchar(25),
    requested_at datetime default current_timestamp,
    message varchar(500),
    proposed_location_id int,
    proposed_at datetime,
    foreign key (requester_id) references `user`(user_id),
    foreign key (requested_item_id) references clothing_item(item_id),
    foreign key (offered_item_id) references clothing_item(item_id),
    foreign key (proposed_location_id) references location(location_id) on delete set null
);

create table exchange(
    exchange_id int primary key,
    request_id int unique,
    accepted_at datetime,
    completed_at datetime,
    status varchar(25),
    foreign key (request_id) references exchange_request(request_id)
);

create table charity_program(
    program_id int primary key,
    foundation_id int,
    program_name varchar(100),
    program_description text,
    target_beneficiaries varchar(100),
    status varchar(25),
    foreign key (foundation_id) references charity_foundation(foundation_id)
);

create table drop_off_point(
    dropoff_id int primary key auto_increment,
    name varchar(100) not null,
    campus_zone varchar(50),
    building_name varchar(100),
    floor_details varchar(150),
    address_line varchar(255),
    location_id int,
    latitude decimal(9,6),
    longitude decimal(9,6),
    operating_hours varchar(150),
    fill_percent int default 0,
    total_kg_collected decimal(8,2) default 0,
    last_emptied_at datetime,
    is_active boolean default true,
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp on update current_timestamp,
    foreign key (location_id) references location(location_id) on delete set null
);

create table charity_donation(
    donation_id int primary key,
    item_id int,
    donor_id int,
    foundation_id int,
    program_id int,
    donation_status varchar(25),
    collection_method enum('drop_box','pickup','in_person') default 'drop_box',
    requested_at datetime default current_timestamp,
    completed_at datetime,
    dropoff_id int,
    handled_by int,
    weight_kg decimal(6,2),
    notes varchar(500),
    foreign key (item_id) references clothing_item(item_id),
    foreign key (donor_id) references `user`(user_id),
    foreign key (foundation_id) references charity_foundation(foundation_id),
    foreign key (program_id) references charity_program(program_id),
    foreign key (dropoff_id) references drop_off_point(dropoff_id) on delete set null,
    foreign key (handled_by) references `user`(user_id) on delete set null
);

create table review(
    review_id int primary key,
    reviewer_id int,
    exchange_id int,
    order_id int,
    rating int,
    comment varchar(200),
    created_at datetime default current_timestamp,
    foreign key (reviewer_id) references `user`(user_id),
    foreign key (exchange_id) references exchange(exchange_id),
    foreign key (order_id) references thrift_order(order_id)
);

create table clothing_item_image(
    image_id int primary key auto_increment,
    item_id int not null,
    image_url varchar(500) not null,
    alt_text varchar(255),
    position int default 0,
    is_primary boolean default false,
    created_at datetime default current_timestamp,
    storage_key varchar(255),
    mime_type varchar(50),
    file_size_bytes int unsigned,
    uploaded_by int,
    foreign key (item_id) references clothing_item(item_id) on delete cascade,
    foreign key (uploaded_by) references `user`(user_id) on delete set null
);

create table message(
    message_id bigint primary key auto_increment,
    sender_id int not null,
    recipient_id int not null,
    item_id int,
    body varchar(1000) not null,
    sent_at datetime default current_timestamp,
    read_at datetime,
    foreign key (sender_id) references `user`(user_id) on delete cascade,
    foreign key (recipient_id) references `user`(user_id) on delete cascade,
    foreign key (item_id) references clothing_item(item_id) on delete set null
);

create table user_setting(
    user_id int primary key,
    eco_goal_kg decimal(6,2) default 15,
    budget_max decimal(10,2) default 50,
    notify_email boolean default true,
    notify_trades boolean default true,
    updated_at datetime default current_timestamp on update current_timestamp,
    foreign key (user_id) references `user`(user_id) on delete cascade
);

create table user_preferred_location(
    user_id int,
    location_id int,
    primary key (user_id, location_id),
    foreign key (user_id) references `user`(user_id) on delete cascade,
    foreign key (location_id) references location(location_id) on delete cascade
);

use oracle;

create table if not exists charity_verification_doc(
    doc_id int not null primary key,
    foundation_id int not null,
    doc_type varchar(50),
    file_name varchar(255),
    mime_type varchar(100),
    file_data longtext,
    review_status varchar(25) default 'pending',
    admin_note varchar(255),
    submitted_at datetime,
    reviewed_at datetime,
    key idx_cvd_foundation (foundation_id)
);

alter table `user` add column instagram varchar(30) null;

create table contact_request(
    request_id int primary key,
    requester_id int not null,
    recipient_id int not null,
    kind varchar(10) not null,            -- 'phone' or 'instagram'
    status varchar(10) not null default 'pending',  -- pending / accepted / declined
    created_at datetime,
    responded_at datetime,
    key idx_cr_req (requester_id),
    key idx_cr_rec (recipient_id),
    foreign key (requester_id) references `user`(user_id),
    foreign key (recipient_id) references `user`(user_id)
);
